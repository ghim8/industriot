<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Relai;
use App\Models\JournalRelai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RelaiController extends BaseController
{
   public function index(Request $request)
{
    $entrepriseId = $this->getEntrepriseId($request);
    $userId       = $request->query('user_id');
    $user         = $userId ? \App\Models\Utilisateur::find($userId) : $request->user();

    $query = Relai::with(['machine', 'actionneur']);

    // Filtre tenant
    if ($entrepriseId) {
        $query->whereHas('machine', function($q) use ($entrepriseId) {
            $q->where('entreprise_id', $entrepriseId);
        });
    }

    // Filtre par rôle
    if ($user?->role === 'chef') {
        $machineIds = \App\Models\Affectation::where('utilisateur_id', $user->id)
                                             ->pluck('machine_id');
        $query->whereIn('machine_id', $machineIds);

    } elseif ($user?->role === 'operateur') {
        $actionneurIds = \DB::table('actionneur_operateur')
                            ->where('operateur_id', $user->id)
                            ->pluck('actionneur_id');
        $query->whereIn('actionneur_id', $actionneurIds);
    }

    return response()->json($query->get());
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
public function journal(Request $request)
{
    $userId = $request->query('user_id');
    $user   = $userId ? \App\Models\Utilisateur::find($userId) : null;

    $query = JournalRelai::with(['relais.machine', 'relais.actionneur', 'utilisateur'])
                         ->orderBy('horodatage', 'desc');

    // Filtre par rôle
    if ($user?->role === 'chef') {
        $machineIds = \App\Models\Affectation::where('utilisateur_id', $user->id)
                                             ->pluck('machine_id');
        $query->whereHas('relais', fn($q) => $q->whereIn('machine_id', $machineIds));

    } elseif ($user?->role === 'operateur') {
        $actionneurIds = \DB::table('actionneur_operateur')
                            ->where('operateur_id', $user->id)
                            ->pluck('actionneur_id');
        $query->whereHas('relais', fn($q) => $q->whereIn('actionneur_id', $actionneurIds));
    }

    return response()->json($query->limit(100)->get()->map(function($j) {
        return [
            'id'             => $j->id,
            'horodatage'     => $j->horodatage,
            'relais_nom'     => $j->relais?->nom,
            'machine_nom'    => $j->relais?->machine?->nom,
            'actionneur_nom' => $j->relais?->actionneur?->nom,
            'actionneur_type'=> $j->relais?->actionneur?->type,
            'ancien_etat'    => $j->ancien_etat,
            'nouvel_etat'    => $j->nouvel_etat,
            'source'         => $j->source,
            'utilisateur_nom'=> $j->utilisateur?->nom ?? 'Système',
            'utilisateur_initiales' => $j->utilisateur?->initiales ?? 'SY',
        ];
    }));
}
}