<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GcashFloat extends Model
{
    protected $table = 'gcash_float';

    protected $fillable = ['balance'];

    protected function casts(): array
    {
        return ['balance' => 'decimal:2'];
    }
}
