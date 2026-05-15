<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;

class EcouterMqtt extends Command
{
    protected $signature   = 'mqtt:ecouter';
    protected $description = 'Écoute les messages MQTT depuis HiveMQ Cloud';

    public function handle()
    {
        $host     = env('MQTT_HOST');
        $port     = (int) env('MQTT_PORT', 8883);
        $username = env('MQTT_USERNAME');
        $password = env('MQTT_PASSWORD');

        $this->info("Connexion à HiveMQ : $host:$port");

        $connectionSettings = (new ConnectionSettings)
            ->setUsername($username)
            ->setPassword($password)
            ->setUseTls(true)
            ->setTlsSelfSignedAllowed(true)
            ->setKeepAliveInterval(60);

        $mqtt = new MqttClient(
            $host,
            $port,
            'laravel-industriot-' . uniqid()
        );

        try {
            $mqtt->connect($connectionSettings, false);
            $this->info('Connecté à HiveMQ Cloud ✅');
        } catch (\Exception $e) {
            $this->error('Erreur connexion : ' . $e->getMessage());
            return;
        }

        // S'abonner à tous les topics usine
        $mqtt->subscribe('usine/#', function(string $topic, string $message) {
            $this->info("[$topic] → $message");

            $data = json_decode($message, true);
            if (!$data || !isset($data['machine_id'], $data['capteur_id'], $data['valeur'])) {
                $this->warn("Payload invalide ignoré");
                return;
            }

            try {
                $capteur = \App\Models\Capteur::find($data['capteur_id']);
                $horsSeuil    = false;
                $seuilDepasse = null;

                if ($capteur) {
                    if ($capteur->seuil_min !== null && $data['valeur'] < $capteur->seuil_min) {
                        $horsSeuil    = true;
                        $seuilDepasse = $capteur->seuil_min;
                    }
                    if ($capteur->seuil_max !== null && $data['valeur'] > $capteur->seuil_max) {
                        $horsSeuil    = true;
                        $seuilDepasse = $capteur->seuil_max;
                    }
                }

                \App\Models\Mesure::create([
                    'machine_id' => $data['machine_id'],
                    'capteur_id' => $data['capteur_id'],
                    'valeur'     => $data['valeur'],
                    'hors_seuil' => $horsSeuil ? 1 : 0,
                ]);

                $this->info("Mesure sauvegardée ✅");

                // Générer alerte si hors seuil
                if ($horsSeuil && $capteur) {
                    $niveau = 'WARNING';
                    if ($capteur->seuil_max !== null && $data['valeur'] > $capteur->seuil_max) {
                        $depassement = ($data['valeur'] - $capteur->seuil_max) / max($capteur->seuil_max, 0.01) * 100;
                        $niveau = $depassement > 15 ? 'CRITIQUE' : 'WARNING';
                    }

                    $existe = \App\Models\Alerte::where('capteur_id', $data['capteur_id'])
                                               ->where('acquittee', 0)
                                               ->where('niveau', $niveau)
                                               ->exists();
                    if (!$existe) {
                        \App\Models\Alerte::create([
                            'machine_id' => $data['machine_id'],
                            'capteur_id' => $data['capteur_id'],
                            'niveau'     => $niveau,
                            'message'    => ucfirst($data['type']) . " hors seuil — Machine " . $data['machine_id'],
                            'valeur'     => $data['valeur'],
                            'seuil'      => $seuilDepasse,
                            'acquittee'  => 0,
                        ]);
                        $this->warn("Alerte $niveau créée ⚠");
                    }
                }

            } catch (\Exception $e) {
                $this->error("Erreur sauvegarde : " . $e->getMessage());
            }

        }, 1);

        $this->info('En écoute sur usine/# ...');
        $mqtt->loop(true);
    }
}