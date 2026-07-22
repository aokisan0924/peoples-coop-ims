<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pos/index');
    }
}
