import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Info, UserPlus } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Location {
    id: number;
    name: string;
}

interface Props {
    locations: Location[];
    canAssignManagers: boolean;
}

export default function CreateUser({ locations, canAssignManagers }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'Cashier' as 'Manager' | 'Cashier',
        location_id: null as number | null,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/users');
    }

    const roleOptions = useMemo(
        () => [
            { value: 'Manager', label: 'Manager' },
            { value: 'Cashier', label: 'Cashier' },
        ],
        [],
    );
    const locationOptions = useMemo(
        () => locations.map((loc) => ({ value: String(loc.id), label: loc.name })),
        [locations],
    );

    return (
        <div
            className="mx-auto max-w-4xl p-3 pb-28 sm:p-6 sm:pb-6"
            style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}
        >
            <Head title="Add User" />

            <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 gap-1.5 text-muted-foreground">
                <Link href="/users">
                    <ArrowLeft className="size-4" />
                    Users
                </Link>
            </Button>

            <Card className="animate-in fade-in-0 slide-in-from-bottom-2 shadow-sm duration-300">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)] ring-1 ring-[var(--pos-teal)]/15">
                            <UserPlus className="size-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Add User</CardTitle>
                            <CardDescription>Give a new team member access to the system.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1.5 focus-visible:ring-[var(--pos-teal)]"
                                    autoFocus
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1.5 focus-visible:ring-[var(--pos-teal)]"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="mt-1.5 max-w-md focus-visible:ring-[var(--pos-teal)]"
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            {canAssignManagers && (
                                <>
                                    <div>
                                        <Label htmlFor="role">Role *</Label>
                                        <Combobox
                                            id="role"
                                            options={roleOptions}
                                            value={data.role}
                                            onChange={(v) => setData('role', v as 'Manager' | 'Cashier')}
                                            searchPlaceholder="Search roles…"
                                            emptyText="No matching roles."
                                            className="mt-1.5 w-full"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="location_id">Branch *</Label>
                                        <Combobox
                                            id="location_id"
                                            options={locationOptions}
                                            value={data.location_id ? String(data.location_id) : null}
                                            onChange={(v) => setData('location_id', Number(v))}
                                            placeholder="Select branch"
                                            searchPlaceholder="Search branches…"
                                            emptyText="No matching branches."
                                            className="mt-1.5 w-full"
                                        />
                                        {errors.location_id && <p className="mt-1 text-sm text-red-600">{errors.location_id}</p>}
                                    </div>
                                </>
                            )}
                        </div>

                        {!canAssignManagers && (
                            <p className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                                <Info className="mt-0.5 size-4 shrink-0" />
                                This user will be added as a Cashier at your branch.
                            </p>
                        )}

                        {/* On mobile, actions pin to the bottom of the viewport so they stay
                            reachable no matter how far the form scrolls; on larger screens
                            they sit inline right after the fields as before. */}
                        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:static sm:z-auto sm:mt-6 sm:flex-row-reverse sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:flex-1"
                            >
                                {processing ? 'Saving…' : 'Save User'}
                            </Button>
                            <Button type="button" variant="outline" asChild className="sm:flex-1">
                                <Link href="/users">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

CreateUser.layout = {
    breadcrumbs: [
        { title: 'Users', href: '/users' },
        { title: 'Add User', href: '/users/create' },
    ],
};
