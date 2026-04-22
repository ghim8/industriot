<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use App\Models\Utilisateur;
use Illuminate\Http\Request;

class AffectationController extends Controller
{
    public function index()
    {
        $chefs = Utilisateur::where('role', 'chef')
                            ->where('statut', 'ACTIF')
                            ->get();

        $result = $chefs->map(function($chef) {
            $affectations = Affectation::where('utilisateur_id', $chef->id)
                                       ->with('machine')
                                       ->get();
            return [
                'id'          => $chef->id,
                'nom'         => $chef->nom,
                'email'       => $chef->email,
                'initiales'   => $chef->initiales,
                'statut'      => $chef->statut,
                'machines'    => $affectations->map(fn($a) => $a->machine),
            ];
        });

        return response()->json($result);
    }

    public function affecter(Request $request)
    {
        $request->validate([
            'utilisateur_id' => 'required|integer',
            'machine_id'     => 'required|integer',
        ]);

        $exists = Affectation::where('utilisateur_id', $request->utilisateur_id)
                             ->where('machine_id', $request->machine_id)
                             ->exists();

        if ($exists) {
            return response()->json(['message' => 'Affectation déjà existante'], 409);
        }

        $affectation = Affectation::create([
            'utilisateur_id' => $request->utilisateur_id,
            'machine_id'     => $request->machine_id,
            'affecte_par'    => $request->affecte_par ?? null,
        ]);

        return response()->json($affectation, 201);
    }

    public function retirer($utilisateur_id, $machine_id)
    {
        Affectation::where('utilisateur_id', $utilisateur_id)
                   ->where('machine_id', $machine_id)
                   ->delete();

        return response()->json(['message' => 'Affectation retirée']);
    }
   public function mesOperateurs(Request $request)
{
    $chefId = $request->query('chef_id');

    // Machines affectées au chef
    $machineIds = Affectation::where('utilisateur_id', $chefId)
                             ->pluck('machine_id');

    // Opérateurs affectés à ces machines
    $operateurIds = Affectation::whereIn('machine_id', $machineIds)
                               ->pluck('utilisateur_id')
                               ->unique();

    // Filtre uniquement les opérateurs
    $operateurs = Utilisateur::whereIn('id', $operateurIds)
                             ->where('role', 'operateur')
                             ->get();

    return response()->json($operateurs);
}
public function addChef(Request $request)
{
    $request->validate([
        'nom'          => 'required|string|max:100',
        'email'        => ['required', 'email', 'unique:utilisateurs,email', 'regex:/@usine\.local$/'],
        'mot_de_passe' => 'required|string|min:6',
    ]);

    $mots = explode(' ', trim($request->nom));
    $initiales = '';
    foreach ($mots as $mot) {
        $initiales .= strtoupper(mb_substr($mot, 0, 1));
        if (strlen($initiales) >= 3) break;
    }

    $chef = \App\Models\Utilisateur::create([
        'nom'          => $request->nom,
        'email'        => $request->email,
        'mot_de_passe' => \Illuminate\Support\Facades\Hash::make($request->mot_de_passe),
        'role'         => 'chef',
        'initiales'    => $initiales,
        'statut'       => 'ACTIF',
        'mdp_change'   => 0,
    ]);

    return response()->json($chef, 201);
}
}