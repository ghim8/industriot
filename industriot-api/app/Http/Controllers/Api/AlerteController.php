<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use Illuminate\Http\Request;

class AlerteController extends BaseController
{
    public function index(Request $request)
    {
        $entrepriseId = $this->getEntrepriseId($request);
        $user         = $request->user();

        $query = \App\Models\Alerte::with('machine')
                                   ->orderBy('cree_le', 'desc')
                                   ->limit(200); // ✅ max 200 alertes

        if ($entrepriseId) {
            $query->where('entreprise_id', $entrepriseId);
        }

        if ($user?->role === 'operateur') {
            $actionneurIds = \DB::table('actionneur_operateur')
                               ->where('operateur_id', $user->id)
                               ->pluck('actionneur_id');
            $capteurIds = \DB::table('actionneur_capteur')
                            ->whereIn('actionneur_id', $actionneurIds)
                            ->pluck('capteur_id');
            $query->whereIn('capteur_id', $capteurIds);
        }

        if ($user?->role === 'chef') {
            $machineIds = \App\Models\Affectation::where('utilisateur_id', $user->id)
                                                 ->pluck('machine_id');
            $query->whereIn('machine_id', $machineIds);
        }

        // ✅ Charger tous les actionneurs en UNE seule requête
        $alertes      = $query->get();
        $capteurIds   = $alertes->pluck('capteur_id')->unique();
        $actionneurs  = \DB::table('actionneur_capteur')
            ->join('actionneurs', 'actionneurs.id', '=', 'actionneur_capteur.actionneur_id')
            ->whereIn('actionneur_capteur.capteur_id', $capteurIds)
            ->select('actionneur_capteur.capteur_id', 'actionneurs.id', 'actionneurs.nom', 'actionneurs.type')
            ->get()
            ->keyBy('capteur_id');

        $alertes = $alertes->map(function($alerte) use ($actionneurs) {
            $alerte->actionneur  = $actionneurs->get($alerte->capteur_id);
            $alerte->machine_nom = $alerte->machine?->nom;
            return $alerte;
        });

        return response()->json($alertes);
    }

    public function acquitter(Request $request, $id)
    {
        $alerte                = Alerte::findOrFail($id);
        $alerte->acquittee     = 1;
        $alerte->acquittee_par = $request->utilisateur_id ?? null;
        $alerte->acquittee_le  = now();
        $alerte->save();
        return response()->json(['message' => 'Alerte acquittée']);
    }

    public function acquitterTout(Request $request)
    {
        $entrepriseId = $this->getEntrepriseId($request);
        $query        = Alerte::where('acquittee', 0);
        if ($entrepriseId) {
            $query->where('entreprise_id', $entrepriseId);
        }
        $query->update([
            'acquittee'     => 1,
            'acquittee_par' => $request->utilisateur_id ?? null,
            'acquittee_le'  => now(),
        ]);
        return response()->json(['message' => 'Toutes les alertes acquittées']);
    }

    public function destroy($id)
    {
        \App\Models\Alerte::findOrFail($id)->delete();
        return response()->json(['message' => 'Alerte supprimée']);
    }

    public function destroySelection(Request $request)
    {
        $request->validate(['ids' => 'required|array']);
        \App\Models\Alerte::whereIn('id', $request->ids)->delete();
        return response()->json(['message' => 'Alertes supprimées']);
    }
}