<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;

class EcouterMqtt extends Command
{
    protected $signature   = 'mqtt:ecouter';
    protected $description = 'Écoute les topics MQTT et sauvegarde les mesures';

    public function handle()
    {
        $this->info('MQTT Listener démarré...');

        $connectionSettings = (new ConnectionSettings)
            ->setUsername(env('MQTT_USERNAME'))
            ->setPassword(env('MQTT_PASSWORD'))
            ->setUseTls(true)
            ->setTlsSelfSignedAllowed(true)
            ->setConnectTimeout(10)
            ->setKeepAliveInterval(60);

        $mqtt = new MqttClient(
            env('MQTT_HOST'),
            (int) env('MQTT_PORT', 8883),
            'laravel-listener-' . uniqid()
        );

        $mqtt->connect($connectionSettings, true);
        $this->info('Connecté à HiveMQ');

        $mqtt->subscribe('usine/+/temperature', function($topic, $message) {
            $this->traiterMesure($topic, $message, 'temperature');
        }, 1);

        $mqtt->subscribe('usine/+/humidite', function($topic, $message) {
            $this->traiterMesure($topic, $message, 'humidite');
        }, 1);

        $mqtt->subscribe('usine/+/courant', function($topic, $message) {
            $this->traiterMesure($topic, $message, 'courant');
        }, 1);

        $mqtt->subscribe('usine/+/gaz', function($topic, $message) {
            $this->traiterMesure($topic, $message, 'gaz');
        }, 1);

        $mqtt->subscribe('usine/+/vibration', function($topic, $message) {
            $this->traiterMesure($topic, $message, 'vibration');
        }, 1);

        // ✅ Écouter le statut des relais envoyé par l'ESP
        $mqtt->subscribe('usine/+/status', function($topic, $message) {
            $this->traiterStatutRelais($topic, $message);
        }, 1);

        $this->info('Abonné aux topics usine/+/...');
        $mqtt->loop(true);
    }

    private function traiterMesure($topic, $message, $type)
    {
        $data = json_decode($message, true);
        if (!$data) {
            \Log::warning("MQTT JSON invalide: $message");
            return;
        }

        $this->info("$topic → " . json_encode($data));

        try {
            $capteur = \App\Models\Capteur::find($data['capteur_id'] ?? null);
            if (!$capteur) {
                \Log::warning("Capteur introuvable: " . ($data['capteur_id'] ?? 'null'));
                return;
            }

            $valeur  = (float) $data['valeur'];
            $machine = \App\Models\Machine::find($data['machine_id']);

            // ── Calcul hors seuil ──
            $horseSeuil   = false;
            $niveau       = null;
            $seuilDepasse = null;

            // ✅ Traitement spécial pour vibration (capteur binaire 0/1)
            if ($type === 'vibration') {
                if ($valeur >= 1.0) {
                    $horseSeuil   = true;
                    $niveau       = 'CRITIQUE';
                    $seuilDepasse = 1.0;
                }
            } else {
                // ── Logique Warning 90% / Critique 100% pour les autres capteurs ──
                if ($capteur->seuil_max !== null) {
                    $seuil100 = (float) $capteur->seuil_max;
                    $seuil90  = $seuil100 * 0.9;

                    if ($valeur >= $seuil100) {
                        $horseSeuil   = true;
                        $niveau       = 'CRITIQUE';
                        $seuilDepasse = $seuil100;
                    } elseif ($valeur >= $seuil90) {
                        $horseSeuil   = true;
                        $niveau       = 'WARNING';
                        $seuilDepasse = round($seuil90, 2);
                    }
                }

                if ($capteur->seuil_min !== null && $valeur < (float) $capteur->seuil_min) {
                    $horseSeuil   = true;
                    $niveau       = $niveau ?? 'WARNING';
                    $seuilDepasse = $seuilDepasse ?? $capteur->seuil_min;
                }
            }

            // ── Sauvegarder la mesure ──
            \App\Models\Mesure::create([
                'machine_id'    => $data['machine_id'],
                'capteur_id'    => $data['capteur_id'],
                'actionneur_id' => $data['actionneur_id'] ?? null,
                'valeur'        => $valeur,
                'hors_seuil'    => $horseSeuil ? 1 : 0,
                'entreprise_id' => $machine?->entreprise_id,
            ]);

            $this->info("Mesure sauvegardée — hors_seuil: " . ($horseSeuil ? 'OUI' : 'NON'));

            // ── Gestion alertes ──
            if ($horseSeuil && $niveau) {

                $messageAlerte = ucfirst($type) . " hors seuil — " . ($machine?->nom ?? 'Machine');

                $alerteActive = \App\Models\Alerte::where('capteur_id', $capteur->id)
                                                  ->where('machine_id', $data['machine_id'])
                                                  ->where('acquittee', 0)
                                                  ->latest('cree_le')
                                                  ->first();

                if ($alerteActive) {
                    $niveauAvant = $alerteActive->niveau;
                    $alerteActive->update([
                        'valeur'  => $valeur,
                        'seuil'   => $seuilDepasse,
                        'niveau'  => $niveau,
                        'message' => $messageAlerte,
                    ]);
                    $this->info("Alerte existante mise à jour");

                    if ($niveau === 'CRITIQUE' && $niveauAvant !== 'CRITIQUE') {
                        $this->envoyerEmail($alerteActive->fresh(), $machine);
                    }

                } else {
                    $nouvelleAlerte = \App\Models\Alerte::create([
                        'machine_id'    => $data['machine_id'],
                        'capteur_id'    => $capteur->id,
                        'niveau'        => $niveau,
                        'message'       => $messageAlerte,
                        'valeur'        => $valeur,
                        'seuil'         => $seuilDepasse,
                        'acquittee'     => 0,
                        'entreprise_id' => $machine?->entreprise_id,
                    ]);
                    $this->warn("Alerte $niveau créée — $type = $valeur");

                    if ($niveau === 'CRITIQUE') {
                        $this->envoyerEmail($nouvelleAlerte, $machine);
                    }
                }

            } else {
                // ✅ Valeur revenue à la normale → acquitter l'alerte active
                $acquittees = \App\Models\Alerte::where('capteur_id', $capteur->id)
                                                ->where('machine_id', $data['machine_id'])
                                                ->where('acquittee', 0)
                                                ->update([
                                                    'acquittee'    => 1,
                                                    'acquittee_le' => now(),
                                                ]);

                if ($acquittees > 0) {
                    $this->info("Alerte auto-acquittée — $type revenue à la normale");
                }
            }

        } catch (\Exception $e) {
            \Log::error("Erreur traitement mesure: " . $e->getMessage());
            $this->error("Erreur: " . $e->getMessage());
        }
    }

    // ✅ Traiter le statut des relais envoyé par l'ESP (alerte → moteur forcé OFF)
    private function traiterStatutRelais($topic, $message)
    {
        $data = json_decode($message, true);
        if (!$data) return;

        $relaisId = $data['relais_id'] ?? null;
        $etat     = $data['etat']      ?? null;

        if ($relaisId === null || $etat === null) return;

        $this->info("Status relais $relaisId → " . ($etat ? 'ON' : 'OFF'));

        try {
            \App\Models\Relai::where('id', $relaisId)->update(['etat' => $etat]);

            // Enregistrer dans le journal
            \App\Models\JournalRelai::create([
                'relais_id'   => $relaisId,
                'ancien_etat' => !$etat,
                'nouvel_etat' => $etat,
                'source'      => 'AUTO', // ← ESP a forcé l'état
            ]);

            $this->info("Relais $relaisId mis à jour en base → " . ($etat ? 'ON' : 'OFF'));
        } catch (\Exception $e) {
            $this->error("Erreur statut relais: " . $e->getMessage());
        }
    }

    private function envoyerEmail($alerte, $machine)
    {
        try {
            $destinataire = env('ALERT_EMAIL', 'azaizzrima@gmail.com');
            \Mail::to($destinataire)->send(new \App\Mail\AlerteMail($alerte, $machine));
            $this->info("Email envoyé à $destinataire");
        } catch (\Exception $e) {
            $this->error("Email non envoyé : " . $e->getMessage());
            \Log::error("Email alerte failed: " . $e->getMessage());
        }
    }
}