<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Deactivating a user (UserManagementController::toggleActive) only blocks
     * *future* logins by itself — someone already logged in, e.g. a cashier's
     * tablet that stays signed in for weeks, would otherwise keep a valid
     * session until it naturally expires. This ends it on their very next
     * request instead.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user && !$user->is_active) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'This account has been deactivated. Contact your manager for access.',
            ]);
        }

        return $next($request);
    }
}
