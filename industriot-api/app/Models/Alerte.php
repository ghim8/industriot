<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Alerte extends Model
{
    protected $table    = 'alertes';
    protected $fillable = [
        'machine_id', 'capteur_id', 'niveau', 'message',
        'valeur', 'seuil', 'acquittee', 'acquittee_par',
        'acquittee_le', 'entreprise_id',
    ];
    const CREATED_AT = 'cree_le';
    const UPDATED_AT = null;

    protected $casts = [
        'cree_le'      => 'datetime',
        'acquittee_le' => 'datetime',
    ];

    public function machine()
    {
        return $this->belongsTo(Machine::class, 'machine_id');
    }
}