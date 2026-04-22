<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // POST /api/login
   public function login(Request $request)
{
    $request->validate([
        'email'        => 'required|email',
        'mot_de_passe' => 'required|string',
    ]);

    $user = Utilisateur::where('email', $request->email)
                       ->where('statut', 'ACTIF')
                       ->first();

    $succes = $user && Hash::check($request->mot_de_passe, $user->mot_de_passe);

    // Enregistre la tentative
    \App\Models\Connexion::create([
        'utilisateur_id' => $succes ? $user->id : null,
        'email_tente'    => $request->email,
        'ip'             => $request->ip(),
        'user_agent'     => $request->userAgent() ?? '',
        'statut'         => $succes ? 'SUCCÈS' : 'ÉCHEC',
        'horodatage'     => now(),
    ]);

    if (!$succes) {
        return response()->json(['message' => 'Email ou mot de passe incorrect'], 401);
    }

    $token = $user->createToken('auth_token')->plainTextToken;

   return response()->json([
    'token' => $token,
    'user'  => [
        'id'         => $user->id,
        'nom'        => $user->nom,
        'email'      => $user->email,
        'role'       => $user->role,
        'initiales'  => $user->initiales,
        'mdp_change' => $user->mdp_change,
    ]
]);
}
    // POST /api/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès']);
    }

    // GET /api/me
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
    public function changerMdp(Request $request)
{
    $request->validate([
        'user_id'      => 'required|integer',
        'nouveau_mdp'  => 'required|string|min:6',
    ]);

    $user = Utilisateur::findOrFail($request->user_id);
    $user->mot_de_passe = Hash::make($request->nouveau_mdp);
    $user->mdp_change   = 1;
    $user->save();

    return response()->json(['message' => 'Mot de passe modifié avec succès']);
}
}