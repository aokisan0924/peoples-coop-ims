import { usePage } from '@inertiajs/react';
import type { Auth, Role } from '@/types';

export function useAuth() {
    const { auth } = usePage<{ auth: Auth }>().props;

    function hasRole(role: Role): boolean {
        return auth.roles?.includes(role) ?? false;
    }

    return {
        user: auth.user,
        roles: auth.roles ?? [],
        hasRole,
        isManager: hasRole('Manager'),
    };
}
