<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Capteur extends Model
{
    protected $table      = 'capteurs';
    public $timestamps    = false;

    protected $fillable = [
        'machine_id', 'type', 'unite', 'seuil_min', 'seuil_max', 'actif'
    ];

    public function machine()
{
    return $this->belongsTo(\App\Models\Machine::class, 'machine_id');
}
}