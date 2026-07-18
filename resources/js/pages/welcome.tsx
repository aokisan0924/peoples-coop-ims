import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
import { Boxes, Building2, Home, Receipt, ShieldCheck, ShoppingCart, Users, Wallet, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

const modules = [
    { icon: ShoppingCart, title: 'Point of Sale', body: 'Ring up sales at the counter — barcode scan or search.' },
    { icon: Boxes, title: 'Inventory', body: 'Stock tracked by batch, with low-stock and expiry alerts.' },
    { icon: Building2, title: 'Branches', body: 'Every location, its stock and sales, in one place.' },
    { icon: Wallet, title: 'GCash Float', body: 'Cash-in, cash-out, and float reconciled per shift.' },
    { icon: Receipt, title: 'Sales & Reports', body: 'Daily totals, per-item sales, and void history.' },
    { icon: ShieldCheck, title: 'Roles & Access', body: 'Owner, Manager, and Cashier each see what they need.' },
];

const pillars = [
    { icon: Users, title: 'Your Coop.', body: 'Stronger together.' },
    { icon: ShoppingCart, title: 'Your Store.', body: 'Better choices, everyday.' },
    { icon: Home, title: 'Your Community.', body: 'Growing for a better tomorrow.' },
];

function useGreeting() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 1000 * 30);
        return () => clearInterval(id);
    }, []);

    if (!now) return { greeting: 'Magandang araw', time: '' };

    const hour = now.getHours();
    const greeting = hour < 12 ? 'Magandang umaga' : hour < 18 ? 'Magandang hapon' : 'Magandang gabi';
    const time = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    return { greeting, time };
}

export default function Welcome() {
    const { auth } = usePage().props;
    const { greeting, time } = useGreeting();

    return (
        <>
            <Head title="People's Coop Gen. Mdse. — Internal System">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=archivo:600,700,800|instrument-sans:400,500,600|ibm-plex-mono:400,500"
                    rel="stylesheet"
                />
            </Head>

            <div className="pcgm-landing min-h-screen">
                <style>{`
                    .pcgm-landing {
                        --ink: #052925;
                        --ink-2: #0a3a33;
                        --ink-line: rgba(245, 251, 249, 0.12);
                        --paper: #f4faf8;
                        --paper-dim: #e2eeea;
                        --teal: #00a79b;
                        --green: #8dc645;
                        font-family: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
                        background: var(--ink);
                        color: var(--paper);
                    }
                    .pcgm-landing .font-display { font-family: 'Archivo', ui-sans-serif, system-ui, sans-serif; }
                    .pcgm-landing .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
                    .pcgm-landing .perforated { position: relative; }
                    .pcgm-landing .perforated::before {
                        content: '';
                        position: absolute;
                        top: -1px; left: 0; right: 0; height: 8px;
                        background-image: radial-gradient(circle, var(--ink) 3px, transparent 3.5px);
                        background-size: 16px 16px;
                        background-position: 0 -4px;
                    }
                    .pcgm-landing .hub-line { stroke-dasharray: 4 5; }
                    @media (prefers-reduced-motion: no-preference) {
                        .pcgm-landing .hub-pulse { animation: pcgm-pulse 2.4s ease-in-out infinite; }
                        .pcgm-landing .drift { animation: pcgm-drift 9s ease-in-out infinite; }
                    }
                    @keyframes pcgm-pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
                    @keyframes pcgm-drift { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                `}</style>

                {/* ---------- NAV ---------- */}
                <header className="border-b border-[var(--ink-line)]">
                    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <img src="/images/pcgm_logo.png" alt="People's Coop Gen. Mdse." className="h-10 w-10 object-contain" />
                            <div className="leading-tight">
                                <p className="font-display text-sm font-extrabold tracking-tight sm:text-base">
                                    People&rsquo;s Coop Gen. Mdse.
                                </p>
                                <p className="font-mono text-[10px] tracking-wide text-[var(--paper-dim)] opacity-70 uppercase">
                                    Internal system
                                </p>
                            </div>
                        </div>
                        <Link
                            href={auth.user ? dashboard() : login()}
                            className="rounded-sm bg-[var(--teal)] px-5 py-2 text-sm font-semibold text-[var(--ink)] transition-opacity hover:opacity-90"
                        >
                            {auth.user ? 'Go to dashboard' : 'Log in'}
                        </Link>
                    </nav>
                </header>

                {/* ---------- HERO ---------- */}
                <section className="relative overflow-hidden border-b border-[var(--ink-line)]">
                    <div className="absolute inset-0">
                        <img
                            src="/images/storefront-dusk.jpg"
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-cover opacity-55"
                        />
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    'linear-gradient(160deg, rgba(0,167,155,0.3) 0%, rgba(5,41,37,0.65) 45%, var(--ink) 92%)',
                            }}
                        />
                    </div>

                    <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
                    <div>
                        <p className="font-mono text-xs tracking-[0.2em] text-[var(--green)] uppercase">
                            {greeting}{time ? ` · ${time}` : ''}
                        </p>
                        <h1 className="font-display mt-4 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
                            Isang sistema.
                            <br />
                            Lahat ng sangay.
                        </h1>
                        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--paper-dim)]">
                            The point-of-sale, inventory, and branch system of People&rsquo;s Coop General Merchandise, under
                            People&rsquo;s Multi-Purpose Cooperative. Log in with your staff account to open the counter,
                            check stock, or review sales — whatever your role covers.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-4">
                            <Link
                                href={auth.user ? dashboard() : login()}
                                className="inline-flex items-center gap-2 rounded-sm bg-[var(--teal)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition-transform hover:-translate-y-0.5"
                            >
                                {auth.user ? 'Go to dashboard' : 'Log in to continue'}
                            </Link>
                            <span className="flex items-center gap-2 text-xs text-[var(--paper-dim)] opacity-70">
                                <WifiOff className="h-3.5 w-3.5" />
                                Works at the counter even when the signal doesn't
                            </span>
                        </div>
                        <p className="font-mono mt-10 text-xs text-[var(--paper-dim)] opacity-50">
                            No account yet? Ask your branch manager to set one up for you.
                        </p>
                        <p className="font-mono mt-2 text-[11px] tracking-[0.15em] text-[var(--green)] opacity-70 uppercase">
                            One Coop. One Store. One Community. One Future.
                        </p>
                    </div>

                    {/* Signature: hub + branch diagram, receipt-tab styled */}
                    <div className="drift relative">
                        <svg viewBox="0 0 420 320" className="w-full" role="img" aria-label="Dashboard connected to three branch tills">
                            <line x1="120" y1="160" x2="330" y2="60" stroke="var(--green)" strokeWidth="1.5" className="hub-line" />
                            <line x1="120" y1="160" x2="330" y2="160" stroke="var(--green)" strokeWidth="1.5" className="hub-line" />
                            <line x1="120" y1="160" x2="330" y2="260" stroke="var(--green)" strokeWidth="1.5" className="hub-line" />
                            <circle cx="120" cy="160" r="5" fill="var(--green)" className="hub-pulse" />
                            <circle cx="330" cy="60" r="4" fill="var(--teal)" />
                            <circle cx="330" cy="160" r="4" fill="var(--teal)" />
                            <circle cx="330" cy="260" r="4" fill="var(--teal)" />

                            <g fontFamily="IBM Plex Mono, ui-monospace, monospace">
                                <rect x="20" y="118" width="180" height="84" rx="2" fill="var(--paper)" />
                                <text x="36" y="144" fontSize="11" letterSpacing="1" fill="var(--ink)" opacity="0.6">
                                    ALL BRANCHES — TODAY
                                </text>
                                <text x="36" y="168" fontSize="18" fontWeight="700" fill="var(--ink)">
                                    ₱48,210.00
                                </text>
                                <text x="36" y="188" fontSize="10" fill="var(--teal)">
                                    3 branches synced
                                </text>

                                <rect x="290" y="32" width="155" height="56" rx="2" fill="var(--paper)" />
                                <text x="302" y="52" fontSize="9" fill="var(--ink)" opacity="0.6">BRANCH · ISABELA</text>
                                <text x="302" y="70" fontSize="13" fontWeight="700" fill="var(--ink)">₱12,040.00</text>

                                <rect x="290" y="132" width="155" height="56" rx="2" fill="var(--paper)" />
                                <text x="302" y="152" fontSize="9" fill="var(--ink)" opacity="0.6">BRANCH · QUEZON CITY</text>
                                <text x="302" y="170" fontSize="13" fontWeight="700" fill="var(--ink)">₱19,860.00</text>

                                <rect x="290" y="232" width="155" height="56" rx="2" fill="var(--paper)" />
                                <text x="302" y="252" fontSize="9" fill="var(--ink)" opacity="0.6">BRANCH · PALAYAN CITY</text>
                                <text x="302" y="270" fontSize="13" fontWeight="700" fill="var(--ink)">₱16,310.00</text>
                            </g>
                        </svg>
                    </div>
                    </div>
                </section>

                {/* ---------- PILLARS ---------- */}
                <section className="mx-auto max-w-6xl px-6 py-16">
                    <div className="grid gap-8 sm:grid-cols-3">
                        {pillars.map((p) => (
                            <div key={p.title} className="text-center sm:text-left">
                                <p.icon className="mx-auto h-6 w-6 text-[var(--teal)] sm:mx-0" strokeWidth={1.75} />
                                <h3 className="font-display mt-3 text-lg font-bold">{p.title}</h3>
                                <p className="mt-1 text-sm text-[var(--paper-dim)] opacity-80">{p.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ---------- MODULES ---------- */}
                <section className="border-t border-[var(--ink-line)] bg-[var(--ink-2)]">
                    <div className="mx-auto max-w-6xl px-6 py-16">
                        <p className="font-mono text-xs tracking-[0.2em] text-[var(--green)] uppercase">What's inside</p>
                        <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                            One login, every part of the job.
                        </h2>

                        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {modules.map((m) => (
                                <div key={m.title} className="perforated rounded-sm bg-[var(--paper)] p-6 pt-8 text-[var(--ink)] shadow-sm">
                                    <m.icon className="h-6 w-6 text-[var(--teal)]" strokeWidth={1.75} />
                                    <h3 className="font-display mt-4 text-base font-bold">{m.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed opacity-75">{m.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ---------- FOOTER ---------- */}
                <footer className="border-t border-[var(--ink-line)]">
                    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm md:flex-row md:items-center">
                        <div className="flex items-center gap-3">
                            <img src="/images/pcgm_logo.png" alt="People's Coop Gen. Mdse." className="h-6 w-6 object-contain" />
                            <span className="text-[var(--paper-dim)] opacity-70">
                                People&rsquo;s Multi-Purpose Cooperative — for internal use only
                            </span>
                        </div>
                        <span className="font-mono text-xs text-[var(--paper-dim)] opacity-50">
                            Having trouble logging in? Contact the IT department.
                        </span>
                    </div>
                </footer>
            </div>
        </>
    );
}
