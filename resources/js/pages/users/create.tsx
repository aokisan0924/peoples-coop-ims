import { Head, useForm, Link } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

    return (
        <>
            <Head title="Add User" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Add User</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <Label htmlFor="password">Password *</Label>
                        <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                        {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
                    </div>

                    {canAssignManagers && (
                        <>
                            <div>
                                <Label htmlFor="role">Role *</Label>
                                <Select value={data.role} onValueChange={(v) => setData('role', v as 'Manager' | 'Cashier')}>
                                    <SelectTrigger id="role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Manager">Manager</SelectItem>
                                        <SelectItem value="Cashier">Cashier</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="location_id">Branch *</Label>
                                <Select
                                    value={data.location_id ? String(data.location_id) : ''}
                                    onValueChange={(v) => setData('location_id', Number(v))}
                                >
                                    <SelectTrigger id="location_id">
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((loc) => (
                                            <SelectItem key={loc.id} value={String(loc.id)}>
                                                {loc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.location_id && <p className="text-sm text-red-600 mt-1">{errors.location_id}</p>}
                            </div>
                        </>
                    )}

                    {!canAssignManagers && (
                        <p className="text-sm text-muted-foreground border rounded-lg p-3 bg-muted/30">
                            This user will be added as a Cashier at your branch.
                        </p>
                    )}

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>Save User</Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/users">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateUser.layout = {
    breadcrumbs: [
        { title: 'Users', href: '/users' },
        { title: 'Add User', href: '/users/create' },
    ],
};
