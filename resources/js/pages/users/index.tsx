import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Plus, Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserRow {
    id: number;
    name: string;
    email: string;
    location: { name: string } | null;
    roles: { name: string }[];
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');
}

function RoleBadge({ name }: { name: string }) {
    const isManagerial = name === 'Manager' || name === 'Owner' || name === 'super_admin';
    return (
        <Badge
            className={cn(
                'mr-1 border-0 font-normal',
                isManagerial ? 'bg-[var(--pos-teal)] text-white' : 'bg-[var(--pos-green)]/15 text-[var(--pos-green)]',
            )}
        >
            {name}
        </Badge>
    );
}

export default function UsersIndex({ users, canAssignManagers }: { users: UserRow[]; canAssignManagers: boolean }) {
    function handleDelete(user: UserRow) {
        if (confirm(`Remove user "${user.name}"? This cannot be undone.`)) {
            router.delete(`/users/${user.id}`);
        }
    }

    const isEmpty = users.length === 0;

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title="Users" />

            <div className="mx-auto max-w-[1600px] space-y-4 p-3 pb-24 sm:p-6 sm:pb-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold tracking-tight">Users</h1>
                        {!isEmpty && (
                            <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">
                                {users.length}
                            </Badge>
                        )}
                    </div>
                    <Button asChild className="hidden gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:inline-flex">
                        <Link href="/users/create">
                            <Plus className="size-4" />
                            Add User
                        </Link>
                    </Button>
                </div>

                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Users className="size-7" />
                        </div>
                        <p className="text-sm font-medium">No users yet</p>
                        <p className="max-w-xs text-sm text-muted-foreground">Add your first team member to give them access.</p>
                        {canAssignManagers && (
                            <Button asChild size="sm" className="mt-2 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                                <Link href="/users/create">
                                    <Plus className="size-4" />
                                    Add User
                                </Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Table on larger screens; stacked cards on mobile so email/branch
                            don't get squeezed or force horizontal scrolling. */}
                        <div className="hidden overflow-hidden rounded-xl border sm:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Email</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Role</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Branch</th>
                                        <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-t transition-colors hover:bg-muted/30">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--pos-teal)]/10 text-xs font-semibold text-[var(--pos-teal)]">
                                                        {initials(user.name)}
                                                    </div>
                                                    <span className="font-medium">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-muted-foreground">{user.email}</td>
                                            <td className="p-3">
                                                {user.roles.map((r) => (
                                                    <RoleBadge key={r.name} name={r.name} />
                                                ))}
                                            </td>
                                            <td className="p-3 text-muted-foreground">{user.location?.name ?? '—'}</td>
                                            <td className="p-3 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(user)}
                                                    className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:hidden">
                            {users.map((user) => (
                                <div key={user.id} className="rounded-xl border bg-card p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2.5">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--pos-teal)]/10 text-xs font-semibold text-[var(--pos-teal)]">
                                                {initials(user.name)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Mail className="size-3 shrink-0" />
                                                    {user.email}
                                                </p>
                                                {user.location && (
                                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Building2 className="size-3 shrink-0" />
                                                        {user.location.name}
                                                    </p>
                                                )}
                                                <div className="mt-1.5">
                                                    {user.roles.map((r) => (
                                                        <RoleBadge key={r.name} name={r.name} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 border-t pt-2.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(user)}
                                            className="w-full gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                        >
                                            <Trash2 className="size-3.5" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {!isEmpty && (
                <Button
                    asChild
                    size="icon"
                    className="fixed right-4 bottom-4 z-20 size-12 rounded-full bg-[var(--pos-teal)] text-white shadow-lg shadow-black/20 hover:bg-[var(--pos-teal)]/90 sm:hidden"
                >
                    <Link href="/users/create" aria-label="Add User">
                        <Plus className="size-5" />
                    </Link>
                </Button>
            )}
        </div>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Users', href: '/users' }],
};
