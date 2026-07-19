import { Head, useForm, Link } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import locations from '@/routes/locations';
import { ArrowLeft, Building2, MapPin, Phone, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CreateLocation() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        address: '',
        phone: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(locations.store().url);
    }

    return (
        <div className="mx-auto max-w-7xl p-3 pb-28 sm:p-6 lg:pb-6" style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title="Add Branch" />

            <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 gap-1.5 text-muted-foreground">
                <Link href={locations.index().url}>
                    <ArrowLeft className="size-4" />
                    Branches
                </Link>
            </Button>

            {/* Two columns on wide screens so the form isn't stranded in a narrow
                centered card — a live preview + tips fill the extra space. */}
            <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
                <Card className="mx-auto w-full max-w-3xl animate-in fade-in-0 slide-in-from-bottom-2 shadow-sm duration-300 lg:mx-0 lg:max-w-none">
                    <CardHeader className="sm:px-8 sm:pt-8">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)] ring-1 ring-[var(--pos-teal)]/15">
                                <Store className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Add Branch</CardTitle>
                                <CardDescription>Set up a new store location.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="sm:px-8 sm:pb-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="name">Branch Name *</Label>
                                    <div className="relative mt-1.5">
                                        <Store className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                            placeholder="e.g. Downtown Branch"
                                            autoFocus
                                        />
                                    </div>
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <div className="relative mt-1.5">
                                        <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                            placeholder="e.g. (555) 123-4567"
                                        />
                                    </div>
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="address">Address</Label>
                                <div className="relative mt-1.5">
                                    <MapPin className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
                                    <Textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                        placeholder="Street, city, postal code"
                                        rows={4}
                                    />
                                </div>
                                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                            </div>

                            {/* On mobile/tablet, actions pin to the bottom of the viewport so they
                                stay reachable no matter how far the form scrolls; on large screens,
                                where the sidebar preview is visible, they sit inline after the fields. */}
                            <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:static lg:z-auto lg:mt-6 lg:flex-row-reverse lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:flex-1"
                                >
                                    {processing ? 'Saving…' : 'Save Branch'}
                                </Button>
                                <Button type="button" variant="outline" asChild className="sm:flex-1">
                                    <Link href={locations.index().url}>Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Sidebar — hidden below lg where there isn't room to show it without
                    pushing the form off-balance. */}
                <div className="mt-4 hidden space-y-4 lg:sticky lg:top-6 lg:mt-0 lg:block">
                    <PreviewCard name={data.name} address={data.address} phone={data.phone} />
                    <TipsCard />
                </div>
            </div>
        </div>
    );
}

function PreviewCard({ name, address, phone }: { name: string; address: string; phone: string }) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Preview</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                            <Building2 className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <p className={cn('truncate font-medium', !name && 'text-muted-foreground italic')}>{name || 'Your branch name'}</p>
                            {address && (
                                <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                                    <MapPin className="mt-0.5 size-3 shrink-0" />
                                    <span className="line-clamp-2">{address}</span>
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
                </div>
                <p className="mt-3 text-xs text-muted-foreground">This is how the branch will appear in your branch list.</p>
            </CardContent>
        </Card>
    );
}

function TipsCard() {
    const tips = [
        'Use a name your staff will instantly recognize, like the neighborhood or mall.',
        'Add the full address so receipts and delivery handoffs stay accurate.',
        'You can change any of these details later from the branch list.',
    ];

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tips</CardDescription>
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

CreateLocation.layout = {
    breadcrumbs: [
        { title: 'Branches', href: locations.index().url },
        { title: 'Add Branch', href: locations.create().url },
    ],
};
