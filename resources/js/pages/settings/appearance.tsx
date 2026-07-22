import { Head } from '@inertiajs/react';
import { Palette } from 'lucide-react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <div style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <div className="space-y-6">
                <Heading
                    icon={Palette}
                    variant="small"
                    title="Appearance settings"
                    description="Update the appearance settings for your account"
                />

                <div className="rounded-xl border bg-card p-4 sm:p-6">
                    <AppearanceTabs />
                </div>
            </div>
        </div>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
