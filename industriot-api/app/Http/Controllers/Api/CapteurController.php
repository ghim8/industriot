<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Capteur;
use Illuminate\Http\Request;

class CapteurController extends Controller
{
  public function index(Request $request)
{
    $userId    = $request->query('user_id');
    $machineId = $request->query('machine_id');
    $user      = $userId ? \App\Models\Utilisateur::find($userId) : null;

    if (!$user || $user->role === 'admin') {
        $query = \App\Models\Capteur::with('machine');
    } else {
        $machineIds = \App\Models\Affectation::where('utilisateur_id', $user->id)
                                             ->pluck('machine_id');
        $query = \App\Models\Capteur::with('machine')
                                    ->whereIn('machine_id', $machineIds);
    }

    // Filtre par machine_id si fourni
    if ($machineId) {
        $query->where('machine_id', $machineId);
    }

    return response()->json($query->get());
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