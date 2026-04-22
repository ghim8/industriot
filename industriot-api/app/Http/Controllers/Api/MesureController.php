<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mesure;
use App\Models\Capteur;
use Illuminate\Http\Request;
use App\Services\AlertService;


class MesureController extends Controller
{
    // Dernières mesures par capteur
    public function index(Request $request)
{
    $machineId = $request->query('machine_id');
    $userId    = $request->query('user_id');
    $user      = $userId ? \App\Models\Utilisateur::find($userId) : null;

    // Vérification accès pour chef/opérateur
    if ($user && $user->role !== 'admin' && $machineId) {
        $aAcces = \App\Models\Affectation::where('utilisateur_id', $user->id)
                                         ->where('machine_id', $machineId)
                                         ->exists();
        if (!$aAcces) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
    }
    

    $capteurs = \App\Models\Capteur::where('machine_id', $machineId)
                                   ->where('actif', 1)
                                   ->get();

    $result = $capteurs->map(function($capteur) {
        $mesures = \App\Models\Mesure::where('capteur_id', $capteur->id)
                                     ->orderBy('horodatage', 'desc')
                                     ->limit(30)
                                     ->get()
                                     ->reverse()
                                     ->values();
        return [
            'capteur'  => $capteur,
            'mesures'  => $mesures,
            'derniere' => $mesures->last(),
        ];
    });

    return response()->json($result);
}

    // Ajouter une mesure (simulateur)
    public function store(Request $request)
{
    $request->validate([
        'machine_id' => 'required|integer',
        'capteur_id' => 'required|integer',
        'valeur'     => 'required|numeric',
    ]);

    $capteur    = \App\Models\Capteur::with('machine')->findOrFail($request->capteur_id);
    $horseSeuil = false;
    $seuilDepasse = null;

    if ($capteur->seuil_min !== null && $request->valeur < $capteur->seuil_min) {
        $horseSeuil   = true;
        $seuilDepasse = $capteur->seuil_min;
    }
    if ($capteur->seuil_max !== null && $request->valeur > $capteur->seuil_max) {
        $horseSeuil   = true;
        $seuilDepasse = $capteur->seuil_max;
    }

    $mesure = \App\Models\Mesure::create([
        'machine_id' => $request->machine_id,
        'capteur_id' => $request->capteur_id,
        'valeur'     => $request->valeur,
        'hors_seuil' => $horseSeuil ? 1 : 0,
    ]);

    if ($horseSeuil) {
        // Déterminer le niveau
        $niveau = 'WARNING';
        if ($capteur->seuil_max !== null && $request->valeur > $capteur->seuil_max) {
            $depassement = ($request->valeur - $capteur->seuil_max) / $capteur->seuil_max * 100;
            $niveau = $depassement > 15 ? 'CRITIQUE' : 'WARNING';
        }

        $machineName = $capteur->machine->nom ?? 'Machine inconnue';
        $typeLabel   = ucfirst($capteur->type);

        // Créer une nouvelle alerte à chaque dépassement
        // (limite : max 1 alerte non acquittée par capteur)
        $alerteExistante = \App\Models\Alerte::where('capteur_id', $request->capteur_id)
                                             ->where('acquittee', 0)
                                             ->where('niveau', $niveau)
                                             ->exists();

        if (!$alerteExistante) {
            \App\Models\Alerte::create([
                'machine_id' => $request->machine_id,
                'capteur_id' => $request->capteur_id,
                'niveau'     => $niveau,
                'message'    => "{$typeLabel} hors seuil — {$machineName}",
                'valeur'     => $request->valeur,
                'seuil'      => $seuilDepasse,
                'acquittee'  => 0,
            ]);
        } else {
            // Mettre à jour la valeur de l'alerte existante
            \App\Models\Alerte::where('capteur_id', $request->capteur_id)
                              ->where('acquittee', 0)
                              ->where('niveau', $niveau)
                              ->update([
                                  'valeur' => $request->valeur,
                                  'seuil'  => $seuilDepasse,
                              ]);
        }
    }

    return response()->json($mesure, 201);
}
    
}