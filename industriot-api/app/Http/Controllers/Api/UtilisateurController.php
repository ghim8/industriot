<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UtilisateurController extends Controller
{
    public function index()
    {
        return response()->json(Utilisateur::all());
    }

    public function operateurs()
    {
        return response()->json(Utilisateur::where('role', 'operateur')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom'          => 'required|string|max:100',
            'email'        => ['required', 'email', 'unique:utilisateurs,email', 'regex:/@usine\.local$/'],
            'mot_de_passe' => 'required|string|min:6',
            'role'         => 'required|in:admin,chef,operateur',
        ]);

        $mots = explode(' ', trim($request->nom));
        $initiales = '';
        foreach ($mots as $mot) {
            $initiales .= strtoupper(mb_substr($mot, 0, 1));
            if (strlen($initiales) >= 3) break;
        }

        $user = Utilisateur::create([
            'nom'          => $request->nom,
            'email'        => $request->email,
            'mot_de_passe' => Hash::make($request->mot_de_passe),
            'role'         => $request->role,
            'initiales'    => $initiales,
            'statut'       => 'ACTIF',
            'mdp_change'   => 0,
        ]);

        return response()->json($user, 201);
    }

    public function update(Request $request, $id)
    {
        $user = Utilisateur::findOrFail($id);

        if ($request->has('email')) {
            if (!preg_match('/@usine\.local$/', $request->email)) {
                return response()->json(['message' => 'L\'email doit être au format @usine.local'], 422);
            }
        }

        $data = $request->except('mot_de_passe');
        if ($request->filled('mot_de_passe')) {
            $data['mot_de_passe'] = Hash::make($request->mot_de_passe);
        }
        $user->update($data);
        return response()->json($user);
    }

    public function destroy($id)
    {
        Utilisateur::findOrFail($id)->delete();
        return response()->json(['message' => 'Utilisateur supprimé']);
    }
}