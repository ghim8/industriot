<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\Affectation;
use Illuminate\Http\Request;

class MachineController extends Controller
{
    private function getMachineIds(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        if (!$user || $user->role === 'admin') return null;
        return Affectation::where('utilisateur_id', $user->id)->pluck('machine_id');
    }

    public function index(Request $request)
    {
        $user = \App\Models\Utilisateur::find($request->query('user_id'));
        if (!$user || $user->role === 'admin') {
            return response()->json(Machine::all());
        }
        $machineIds = Affectation::where('utilisateur_id', $user->id)->pluck('machine_id');
        return response()->json(Machine::whereIn('id', $machineIds)->get());
    }

    public function show($id)
    {
        return response()->json(Machine::findOrFail($id));
    }

    public function store(Request $request)
{
    $request->validate([
        'nom'          => 'required|string|max:150',
        'localisation' => 'required|string|max:200',
    ]);

    $machine = Machine::create([
        'nom'          => $request->nom,
        'localisation' => $request->localisation,
        'topic_mqtt'   => $request->topic_mqtt  ?? '',
        'description'  => $request->description ?? '',
        'statut'       => $request->statut       ?? 'EN SERVICE',
        'est_statique' => 0,
    ]);

    // Créer les capteurs sélectionnés
    if ($request->has('capteurs') && is_array($request->capteurs)) {
        $unites = [
            'temperature' => '°C',
            'humidite'    => '%',
            'courant'     => 'A',
            'vibration'   => 'g',
            'gaz'         => 'ppm',
            'pression'    => 'bar',
        ];
        foreach ($request->capteurs as $cap) {
            \App\Models\Capteur::create([
                'machine_id' => $machine->id,
                'type'       => $cap['type'],
                'unite'      => $cap['unite'] ?? $unites[$cap['type']] ?? '',
                'seuil_min'  => $cap['seuil_min'] ?? null,
                'seuil_max'  => $cap['seuil_max'] ?? null,
                'actif'      => 1,
            ]);
        }
    }

    return response()->json($machine, 201);
}

    public function update(Request $request, $id)
    {
        $machine = Machine::findOrFail($id);
        $machine->update([
            'nom'          => $request->nom          ?? $machine->nom,
            'localisation' => $request->localisation ?? $machine->localisation,
            'topic_mqtt'   => $request->topic_mqtt   ?? $machine->topic_mqtt,
            'description'  => $request->description  ?? $machine->description,
            'statut'       => $request->statut        ?? $machine->statut,
        ]);
        return response()->json($machine);
    }

    public function destroy($id)
    {
        $machine = Machine::findOrFail($id);
        if ($machine->est_statique) {
            return response()->json(['message' => 'Machine statique non supprimable'], 403);
        }
        $machine->delete();
        return response()->json(['message' => 'Machine supprimée']);
    }

    // Affecter une machine à un utilisateur (chef ou opérateur)
    public function affecter(Request $request, $id)
    {
        $request->validate([
            'utilisateur_id' => 'required|integer',
        ]);

        $exists = Affectation::where('utilisateur_id', $request->utilisateur_id)
                             ->where('machine_id', $id)
                             ->exists();

        if ($exists) {
            return response()->json(['message' => 'Déjà affecté'], 409);
        }

        Affectation::create([
            'utilisateur_id' => $request->utilisateur_id,
            'machine_id'     => $id,
            'affecte_par'    => $request->affecte_par ?? null,
        ]);

        return response()->json(['message' => 'Affectation créée']);
    }

    // Retirer une affectation
    public function retirerAffectation(Request $request, $id)
    {
        Affectation::where('utilisateur_id', $request->utilisateur_id)
                   ->where('machine_id', $id)
                   ->delete();
        return response()->json(['message' => 'Affectation retirée']);
    }

    // Lister les affectations d'une machine
    public function affectations($id)
    {
        $affectations = Affectation::where('machine_id', $id)
                                   ->with('utilisateur')
                                   ->get();
        return response()->json($affectations);
    }
}