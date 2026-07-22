import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, MapPin, Pencil, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import locations from '@/routes/locations';

interface Location {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
}

export default function EditLocation({ location }: { location: Location }) {
    const { data, setData, put, processing, errors } = useForm({
        name: location.name,
        address: location.address ?? '',
        phone: location.phone ?? '',
        is_active: location.is_active,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(locations.update(location.id).url);
    }

    return (
        <div
            className="mx-auto max-w-7xl p-3 pb-28 sm:p-6 lg:pb-6"
            style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}
        >
            <Head title="Edit Branch" />

            <Button
                variant="ghost"
                size="sm"
                asChild
                className="mb-3 -ml-2 gap-1.5 text-muted-foreground"
            >
                <Link href={locations.index().url}>
                    <ArrowLeft className="size-4" />
                    Branches
                </Link>
            </Button>

            {/* Two columns on wide screens so the form isn't stranded in a narrow
                centered card — a live preview + tips fill the extra space. */}
            <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
                <Card className="mx-auto w-full max-w-3xl animate-in shadow-sm duration-300 fade-in-0 slide-in-from-bottom-2 lg:mx-0 lg:max-w-none">
                    <CardHeader className="sm:px-8 sm:pt-8">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)] ring-1 ring-[var(--pos-teal)]/15">
                                <Pencil className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <CardTitle className="text-lg">
                                    Edit Branch
                                </CardTitle>
                                <CardDescription className="truncate">
                                    Editing "{location.name}"
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="sm:px-8 sm:pb-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="name">Branch Name *</Label>
                                    <div className="relative mt-1.5">
                                        <Building2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                            autoFocus
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <div className="relative mt-1.5">
                                        <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) =>
                                                setData('phone', e.target.value)
                                            }
                                            className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="address">Address</Label>
                                <div className="relative mt-1.5">
                                    <MapPin className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
                                    <Textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) =>
                                            setData('address', e.target.value)
                                        }
                                        className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                        rows={4}
                                    />
                                </div>
                                {errors.address && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.address}
                                    </p>
                                )}
                            </div>

                            <label
                                htmlFor="is_active"
                                className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-colors has-[:checked]:border-[var(--pos-teal)]/40 has-[:checked]:bg-[var(--pos-teal)]/5"
                            >
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked === true)
                                    }
                                    className="data-[state=checked]:border-[var(--pos-teal)] data-[state=checked]:bg-[var(--pos-teal)]"
                                />
                                <span>
                                    <span className="block text-sm font-medium">
                                        Active
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        Inactive branches are hidden from staff
                                        selection.
                                    </span>
                                </span>
                            </label>

                            {/* On mobile/tablet, actions pin to the bottom of the viewport so they
                                stay reachable no matter how far the form scrolls; on large screens,
                                where the sidebar preview is visible, they sit inline after the fields. */}
                            <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:static lg:z-auto lg:mt-6 lg:flex-row-reverse lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:flex-1"
                                >
                                    {processing ? 'Saving…' : 'Update Branch'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                    className="sm:flex-1"
                                >
                                    <Link href={locations.index().url}>
                                        Cancel
                                    </Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Sidebar — hidden below lg where there isn't room to show it without
                    pushing the form off-balance. */}
                <div className="mt-4 hidden space-y-4 lg:sticky lg:top-6 lg:mt-0 lg:block">
                    <PreviewCard
                        name={data.name}
                        address={data.address}
                        phone={data.phone}
                        active={data.is_active}
                    />
                    <TipsCard />
                </div>
            </div>
        </div>
    );
}

function PreviewCard({
    name,
    address,
    phone,
    active,
}: {
    name: string;
    address: string;
    phone: string;
    active: boolean;
}) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Preview
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2.5">
                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                <Building2 className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p
                                    className={cn(
                                        'truncate font-medium',
                                        !name && 'text-muted-foreground italic',
                                    )}
                                >
                                    {name || 'Untitled branch'}
                                </p>
                                {address && (
                                    <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                                        <MapPin className="mt-0.5 size-3 shrink-0" />
                                        <span className="line-clamp-2">
                                            {address}
                                        </span>
                                    </p>
                                )}
                                {phone && (
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                        <Phone className="size-3 shrink-0" />
                                        {phone}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Badge
                            className={cn(
                                'shrink-0 gap-1.5 border-0 font-normal',
                                active
                                    ? 'bg-[var(--pos-green)]/15 text-[var(--pos-green)]'
                                    : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
                            )}
                            style={
                                {
                                    '--pos-green': '#8dc645',
                                } as React.CSSProperties
                            }
                        >
                            <span
                                className={cn(
                                    'size-1.5 rounded-full',
                                    active
                                        ? 'bg-[var(--pos-green)]'
                                        : 'bg-red-500',
                                )}
                            />
                            {active ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                    This is how the branch will appear in your branch list.
                </p>
            </CardContent>
        </Card>
    );
}

function TipsCard() {
    const tips = [
        'Turning a branch inactive hides it from staff selection without deleting its history.',
        'Keep the address current so receipts and delivery handoffs stay accurate.',
        'Changes save only after you press Update Branch.',
    ];

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Tips
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {tips.map((tip) => (
                        <li key={tip} className="flex gap-2">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--pos-teal)]" />
                            {tip}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

EditLocation.layout = {
    breadcrumbs: [
        { title: 'Branches', href: locations.index().url },
        { title: 'Edit Branch', href: '#' },
    ],
};
