<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Relai;
use App\Models\JournalRelai;
use Illuminate\Http\Request;

class RelaiController extends Controller
{
   public function index(Request $request)
{
    $userId = $request->query('user_id');
    $user   = $userId ? \App\Models\Utilisateur::find($userId) : null;

    if (!$user || $user->role === 'admin') {
        $relais = \App\Models\Relai::with('machine')->get();
    } else {
        $machineIds = \App\Models\Affectation::where('utilisateur_id', $user->id)
                                             ->pluck('machine_id');
        $relais = \App\Models\Relai::with('machine')
                                   ->whereIn('machine_id', $machineIds)
                                   ->get();
    }
    return response()->json($relais);
}
    public function update(Request $request, $id)
{
    $relai = Relai::findOrFail($id);
    $ancienEtat = $relai->etat;
    $relai->etat = $request->etat;
    $relai->save();

    // Journal
    JournalRelai::create([
        'relais_id'      => $relai->id,
        'utilisateur_id' => $request->utilisateur_id ?? null,
        'ancien_etat'    => $ancienEtat,
        'nouvel_etat'    => $request->etat,
        'source'         => 'MANUEL',
    ]);

    // Publier commande MQTT
    try {
        $mqtt = new \PhpMqtt\Client\MqttClient('localhost', 1883, 'laravel-relais-' . $id);
        $settings = (new \PhpMqtt\Client\ConnectionSettings)->setConnectTimeout(3);
        $mqtt->connect($settings);

        $machine = $relai->machine;
        $topic   = $machine ? $machine->topic_mqtt . '/commandes' : 'usine/commandes/global';

        $payload = json_encode([
            'action'     => $request->etat ? 'ON' : 'OFF',
            'relais_id'  => $relai->id,
            'machine_id' => $relai->machine_id,
            'nom'        => $relai->nom,
            'timestamp'  => now()->timestamp,
        ]);

        $mqtt->publish($topic, $payload, \PhpMqtt\Client\MqttClient::QOS_AT_LEAST_ONCE);
        $mqtt->disconnect();

    } catch (\Exception $e) {
        // Log l'erreur mais ne bloque pas la réponse
        \Log::warning('MQTT publish failed: ' . $e->getMessage());
    }

    return response()->json($relai);
}
}