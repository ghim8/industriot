<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use Illuminate\Http\Request;

class AlerteController extends Controller
{
    public function index()
    {
        $alertes = Alerte::orderBy('cree_le', 'desc')->get();
        return response()->json($alertes);
    }

   public function acquitter(Request $request, $id)
{
    $alerte = Alerte::findOrFail($id);
    $alerte->acquittee     = 1;
    $alerte->acquittee_par = $request->utilisateur_id ?? null;
    $alerte->acquittee_le  = now();
    $alerte->save();
    return response()->json(['message' => 'Alerte acquittée']);
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