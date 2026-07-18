import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UserRow {
    id: number;
    name: string;
    email: string;
    location: { name: string } | null;
    roles: { name: string }[];
}

export default function UsersIndex({ users, canAssignManagers }: { users: UserRow[]; canAssignManagers: boolean }) {
    function handleDelete(user: UserRow) {
        if (confirm(`Remove user "${user.name}"? This cannot be undone.`)) {
            router.delete(`/users/${user.id}`);
        }
    }

    return (
        <>
            <Head title="Users" />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Users</h1>
                    <Button asChild>
                        <Link href="/users/create">+ Add User</Link>
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Email</th>
                                <th className="text-left p-3">Role</th>
                                <th className="text-left p-3">Branch</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                        No users yet.
                                    </td>
                                </tr>
                            )}
                            {users.map((user) => (
                                <tr key={user.id} className="border-t">
                                    <td className="p-3 font-medium">{user.name}</td>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">
                                        {user.roles.map((r) => (
                                            <Badge key={r.name} variant="secondary" className="mr-1">
                                                {r.name}
                                            </Badge>
                                        ))}
                                    </td>
                                    <td className="p-3">{user.location?.name ?? '—'}</td>
                                    <td className="p-3 text-right">
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(user)}>
                                            Remove
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Users', href: '/users' }],
};
