<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;
use App\Models\Mesure;
use App\Models\Capteur;
use App\Models\Relai;
use App\Models\JournalRelai;

class EcouterMqtt extends Command
{
    protected $signature   = 'mqtt:ecouter';
    protected $description = 'Écoute les messages MQTT et sauvegarde les mesures';

    public function handle()
    {
        $this->info('🚀 Démarrage écoute MQTT...');
        $this->info('   Broker : localhost:1883');
        $this->info('   Topics : usine/#');
        $this->info('   Appuie sur Ctrl+C pour arrêter');
        $this->line('');

        $mqtt = new MqttClient('localhost', 1883, 'laravel-industriot');
        $settings = (new ConnectionSettings)
            ->setKeepAliveInterval(60)
            ->setConnectTimeout(5);

        try {
            $mqtt->connect($settings);
            $this->info('✅ Connecté au broker MQTT');
        } catch (\Exception $e) {
            $this->error('❌ Impossible de se connecter : ' . $e->getMessage());
            return 1;
        }

        // S'abonner aux mesures capteurs
        $mqtt->subscribe('usine/+/+', function(string $topic, string $payload) {
            $this->traiterMessage($topic, $payload);
        }, 1);

        $this->info('📡 En écoute sur usine/#');
        $this->line('');

        // Boucle infinie
        $mqtt->loop(true);

        return 0;
    }

    private function traiterMessage(string $topic, string $payload)
    {
        // Ignorer les topics d'état global et commandes
        if (str_ends_with($topic, '/etat') || str_contains($topic, '/commandes')) {
            return;
        }

        try {
            $data = json_decode($payload, true);
            if (!$data || !isset($data['machine_id'], $data['capteur_id'], $data['valeur'])) {
                return;
            }

            // Vérifier que le capteur existe
            $capteur = Capteur::find($data['capteur_id']);
            if (!$capteur) return;

            // Vérifier hors seuil
            $horseSeuil = false;
            if ($capteur->seuil_min !== null && $data['valeur'] < $capteur->seuil_min) $horseSeuil = true;
            if ($capteur->seuil_max !== null && $data['valeur'] > $capteur->seuil_max) $horseSeuil = true;

            // Sauvegarder la mesure
            Mesure::create([
                'machine_id' => $data['machine_id'],
                'capteur_id' => $data['capteur_id'],
                'valeur'     => $data['valeur'],
                'hors_seuil' => $horseSeuil ? 1 : 0,
            ]);

            $status = $horseSeuil ? '🔴' : '🟢';
            $this->line("  {$status} [{$topic}] {$data['type']} = {$data['valeur']} {$data['unite']}");

        } catch (\Exception $e) {
            $this->warn("⚠️  Erreur traitement : " . $e->getMessage());
        }
    }
}