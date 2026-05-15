<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Capteur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CapteurController extends BaseController
{
  public function index(Request $request)
{
    $entrepriseId = $request->attributes->get('_entreprise_id') 
                ?? $request->user()?->entreprise_id;
    $userId    = $request->query('user_id');
    $machineId = $request->query('machine_id');
    $user      = $userId ? \App\Models\Utilisateur::find($userId) : null;

    // Déterminer les actionneurs accessibles
    if (!$user || $user->role === 'admin') {
    $query = \App\Models\Actionneur::with(['capteurs.machine'])
                                   ->where('actif', 1);
    if ($entrepriseId) {
        $query->whereHas('machine', fn($q) => $q->where('entreprise_id', $entrepriseId));
    }
    if ($machineId) $query->where('machine_id', $machineId);
    $actionneurs = $query->get();

} elseif ($user->role === 'chef') {
    $machineIds = \App\Models\Affectation::where('utilisateur_id', $user->id)
                                         ->pluck('machine_id');
    $query = \App\Models\Actionneur::with(['capteurs.machine'])
                                   ->whereIn('machine_id', $machineIds)
                                   ->where('actif', 1);
    if ($machineId) $query->where('machine_id', $machineId);
    $actionneurs = $query->get();

} else {
    $actionneurIds = DB::table('actionneur_operateur')
                       ->where('operateur_id', $user->id)
                       ->pluck('actionneur_id');
    $query = \App\Models\Actionneur::with(['capteurs.machine'])
                                   ->whereIn('id', $actionneurIds)
                                   ->where('actif', 1);
    if ($machineId) $query->where('machine_id', $machineId);
    $actionneurs = $query->get();
}

    // Formater : un groupe par actionneur
    $grouped = $actionneurs->map(function($actionneur) {
        return [
            'actionneur' => $actionneur,
            'capteurs'   => $actionneur->capteurs,
        ];
    });

    return response()->json($grouped->values());
}
    public function store(Request $request)
    {
        $request->validate([
            'machine_id' => 'required|integer',
            'type' => 'required|in:temperature,humidite,courant,vibration,gaz,pression',
            'unite'      => 'required|string|max:20',
        ]);

        $capteur = Capteur::create([
            'machine_id' => $request->machine_id,
            'type'       => $request->type,
            'unite'      => $request->unite,
            'seuil_min'  => $request->seuil_min ?? null,
            'seuil_max'  => $request->seuil_max ?? null,
            'actif'      => 1,
        ]);

        return response()->json($capteur, 201);
    }

    public function update(Request $request, $id)
    {
        $capteur = Capteur::findOrFail($id);
        $capteur->update([
            'seuil_min' => $request->seuil_min ?? $capteur->seuil_min,
            'seuil_max' => $request->seuil_max ?? $capteur->seuil_max,
            'actif'     => $request->actif     ?? $capteur->actif,
        ]);
        return response()->json($capteur);
    }

    public function destroy($id)
    {
        Capteur::findOrFail($id)->delete();
        return response()->json(['message' => 'Capteur supprimé']);
    }
}