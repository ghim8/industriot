<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Connexion;
use App\Models\Affectation;
use App\Models\Utilisateur;
use Illuminate\Http\Request;

class ConnexionController extends BaseController
{
   public function index(Request $request)
{
    $userId = $request->query('user_id');
    $user   = $userId ? \App\Models\Utilisateur::find($userId) : null;

    if (!$user || $user->role === 'admin') {
        $connexions = \App\Models\Connexion::orderBy('horodatage', 'desc')
                                           ->limit(200)
                                           ->get();

    } elseif ($user->role === 'chef') {
        // Récupérer les opérateurs de ce chef via chef_id
        $operateurIds = \App\Models\Utilisateur::where('chef_id', $user->id)
                                               ->where('role', 'operateur')
                                               ->pluck('id');

        // Inclure aussi le chef lui-même
        $userIds = $operateurIds->push($user->id);

        $connexions = \App\Models\Connexion::with('utilisateur')
                                   ->whereIn('utilisateur_id', $userIds)
                                   ->orderBy('horodatage', 'desc')
                                   ->limit(200)
                                   ->get();
    } else {
        // Opérateur → ses connexions uniquement
        $connexions = \App\Models\Connexion::with('utilisateur')
                                           ->where('utilisateur_id', $user->id)
                                           ->orderBy('horodatage', 'desc')
                                           ->limit(100)
                                           ->get();
    }

    return response()->json($connexions);
}
   public function destroy($id)
{
    Connexion::findOrFail($id)->delete();
    return response()->json(['message' => 'Connexion supprimée']);
}

public function destroySelection(Request $request)
{
    $request->validate(['ids' => 'required|array']);
    Connexion::whereIn('id', $request->ids)->delete();
    return response()->json(['message' => 'Connexions supprimées']);
}
}