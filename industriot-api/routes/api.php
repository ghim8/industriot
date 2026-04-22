<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MachineController;
use App\Http\Controllers\Api\AlerteController;
use App\Http\Controllers\Api\RelaiController;
use App\Http\Controllers\Api\UtilisateurController;
use App\Http\Controllers\Api\ConnexionController;
use App\Http\Controllers\Api\CapteurController;
use App\Http\Controllers\Api\AffectationController;
use App\Http\Controllers\Api\MesureController;

// Auth
Route::post('/login',       [AuthController::class, 'login']);
Route::post('/changer-mdp', [AuthController::class, 'changerMdp']);
Route::post('/logout',      [AuthController::class, 'logout']);

// Toutes les routes filtrées par user_id
Route::get('/machines',              [MachineController::class, 'index']);
Route::get('/machines/{id}',         [MachineController::class, 'show']);
Route::post('/machines',             [MachineController::class, 'store']);
Route::put('/machines/{id}',         [MachineController::class, 'update']);
Route::delete('/machines/{id}',      [MachineController::class, 'destroy']);
Route::post('/machines/{id}/affecter',          [MachineController::class, 'affecter']);
Route::post('/machines/{id}/retirer-affectation',[MachineController::class, 'retirerAffectation']);
Route::get('/machines/{id}/affectations',        [MachineController::class, 'affectations']);

Route::get('/alertes',                    [AlerteController::class, 'index']);
Route::post('/alertes/{id}/acquitter',    [AlerteController::class, 'acquitter']);

Route::get('/relais',         [RelaiController::class, 'index']);
Route::put('/relais/{id}',    [RelaiController::class, 'update']);

Route::get('/capteurs',          [CapteurController::class, 'index']);
Route::post('/capteurs',         [CapteurController::class, 'store']);
Route::put('/capteurs/{id}',     [CapteurController::class, 'update']);
Route::delete('/capteurs/{id}',  [CapteurController::class, 'destroy']);

Route::get('/mesures',   [MesureController::class, 'index']);
Route::post('/mesures',  [MesureController::class, 'store']);

Route::get('/utilisateurs',          [UtilisateurController::class, 'index']);
Route::post('/utilisateurs',         [UtilisateurController::class, 'store']);
Route::put('/utilisateurs/{id}',     [UtilisateurController::class, 'update']);
Route::delete('/utilisateurs/{id}',  [UtilisateurController::class, 'destroy']);
Route::get('/operateurs',            [UtilisateurController::class, 'operateurs']);

Route::get('/connexions',     [ConnexionController::class, 'index']);

Route::get('/chefs',          [AffectationController::class, 'index']);
Route::post('/chefs',         [AffectationController::class, 'addChef']);
Route::get('/mes-operateurs', [AffectationController::class, 'mesOperateurs']);
Route::post('/affectations',  [AffectationController::class, 'affecter']);
Route::delete('/affectations/{utilisateur_id}/{machine_id}', [AffectationController::class, 'retirer']);
Route::delete('/alertes/{id}', [AlerteController::class, 'destroy']);
Route::post('/alertes/supprimer-selection', [AlerteController::class, 'destroySelection']);
Route::delete('/connexions/{id}', [ConnexionController::class, 'destroy']);
Route::post('/connexions/supprimer-selection', [ConnexionController::class, 'destroySelection']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
});