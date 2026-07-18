import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthPcgmLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="pcgm-auth relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <style>{`
                .pcgm-auth {
                    --ink: #052925;
                    --paper-dim: #e2eeea;
                    --teal: #00a79b;
                    --green: #8dc645;
                }
            `}</style>

            {/* ---------- BRAND PANEL ---------- */}
            <div className="relative hidden h-full flex-col justify-between overflow-hidden p-10 text-white lg:flex">
                <img
                    src="/images/storefront-dusk.jpg"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover opacity-55"
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(160deg, rgba(0,167,155,0.35) 0%, rgba(5,41,37,0.75) 45%, var(--ink) 95%)',
                    }}
                />

                <Link href={home()} className="relative z-20 flex items-center gap-3">
                    <img src="/images/pcgm_logo.png" alt="" className="h-10 w-10 object-contain" />
                    <span className="text-lg font-bold tracking-tight">People&rsquo;s Coop Gen. Mdse.</span>
                </Link>

                <p className="relative z-20 text-xs tracking-[0.15em] text-[var(--green)] uppercase">
                    One Coop. One Store. One Community. One Future.
                </p>
            </div>

            {/* ---------- FORM PANEL ---------- */}
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center gap-2 lg:hidden"
                    >
                        <img src="/images/pcgm_logo.png" alt="" className="h-9 w-9 object-contain" />
                        <span className="font-bold tracking-tight">People&rsquo;s Coop Gen. Mdse.</span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
