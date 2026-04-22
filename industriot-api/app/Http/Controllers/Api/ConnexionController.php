<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Connexion;
use App\Models\Affectation;
use App\Models\Utilisateur;
use Illuminate\Http\Request;

class ConnexionController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        $user   = $userId ? Utilisateur::find($userId) : null;

        if (!$user || $user->role === 'admin') {
            $connexions = Connexion::orderBy('horodatage', 'desc')->limit(100)->get();
        } elseif ($user->role === 'chef') {
            // Ses opérateurs
            $machineIds    = Affectation::where('utilisateur_id', $user->id)->pluck('machine_id');
            $operateurIds  = Affectation::whereIn('machine_id', $machineIds)
                                        ->pluck('utilisateur_id')
                                        ->unique();
            $userIds = $operateurIds->push($user->id)->unique();
            $connexions = Connexion::whereIn('utilisateur_id', $userIds)
                                   ->orderBy('horodatage', 'desc')
                                   ->limit(100)
                                   ->get();
        } else {
            // Opérateur — ses connexions uniquement
            $connexions = Connexion::where('utilisateur_id', $user->id)
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