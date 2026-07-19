import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';

// What this system actually does, shown as a rotating showcase — real
// capabilities from the codebase, not marketing copy.
const FEATURES = [
    {
        title: 'Works Even When the Internet Doesn\u2019t',
        body: 'Checkout keeps running offline and syncs automatically once the connection is back \u2014 no sales lost to a dropped line.',
    },
    {
        title: 'FIFO Stock, Tracked to the Batch',
        body: 'Every delivery is its own batch. Stock is deducted oldest-first, so cost and margin stay accurate down to the peso.',
    },
    {
        title: 'Member & Non-Member Pricing, Built In',
        body: 'Member and walk-in prices are computed automatically, VAT included where it applies \u2014 no manual price lookups at the counter.',
    },
    {
        title: 'One System, Every Branch',
        body: 'Stock, sales, and cashiers are tracked per location, so managers see exactly what\u2019s happening at each branch in real time.',
    },
    {
        title: 'GCash Float, Reconciled',
        body: 'Cash-in and cash-out for GCash transactions are logged against a running float, so end-of-day reconciliation isn\u2019t guesswork.',
    },
    {
        title: 'Access That Matches the Role',
        body: 'Cashiers see the register. Managers see pricing, stock, and reports. Nobody sees more than their job needs.',
    },
    {
        title: 'A Dashboard That Answers Questions',
        body: 'Sales trends, best sellers, and cashier performance are one screen away \u2014 no spreadsheet exports required.',
    },
];

// Short, factual descriptors of what the coop is — not invented statistics.
const QUICK_FACTS = ['Member-owned', 'Multi-purpose coop', 'Community-first'];

const easeOut = [0.16, 1, 0.3, 1] as const;

// Simple leaf silhouette echoing the mark in the coop logo, reused as a
// drifting background motif at low opacity.
function Leaf({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            style={style}
            aria-hidden="true"
        >
            <path
                d="M20 4C10 4 4 10 4 20c10 0 16-6 16-16Z"
                fill="currentColor"
            />
        </svg>
    );
}

function useManilaClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 1000);

        return () => window.clearInterval(timer);
    }, []);

    return now;
}

export default function AuthPcgmLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const [featureIndex, setFeatureIndex] = useState(0);
    const now = useManilaClock();
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const timer = window.setInterval(() => {
            setFeatureIndex((i) => (i + 1) % FEATURES.length);
        }, 5000);

        return () => window.clearInterval(timer);
    }, []);

    const feature = FEATURES[featureIndex];

    const timeLabel = new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
    }).format(now);

    const dateLabel = new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(now);

    return (
        <div
            className="pcgm-auth relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0"
            style={{ colorScheme: 'light', color: '#052925' }}
        >
            <style>{`
                .pcgm-auth {
                    color-scheme: light;
                    color: #052925;

                    --ink: #052925;
                    --paper-dim: #e2eeea;
                    --teal: #00a79b;
                    --green: #8dc645;

                    /* Lock shadcn's theme tokens to their light values here, regardless
                       of the person's dark-mode setting elsewhere in the app. This card
                       is a fixed light+teal brand surface, not a theme-aware one — without
                       this, a dark-mode preference makes text/input colors resolve to
                       near-white on our white card, i.e. invisible. */
                    --background: oklch(1 0 0);
                    --foreground: oklch(0.145 0 0);
                    --card: oklch(1 0 0);
                    --card-foreground: oklch(0.145 0 0);
                    --popover: oklch(1 0 0);
                    --popover-foreground: oklch(0.145 0 0);
                    --primary: oklch(0.205 0 0);
                    --primary-foreground: oklch(0.985 0 0);
                    --secondary: oklch(0.97 0 0);
                    --secondary-foreground: oklch(0.205 0 0);
                    --muted: oklch(0.97 0 0);
                    --muted-foreground: oklch(0.556 0 0);
                    --accent: oklch(0.97 0 0);
                    --accent-foreground: oklch(0.205 0 0);
                    --border: oklch(0.922 0 0);
                    --input: oklch(0.922 0 0);
                    --ring: oklch(0.87 0 0);
                }

                @keyframes pcgm-kenburns {
                    from { transform: scale(1) translate3d(0, 0, 0); }
                    to { transform: scale(1.09) translate3d(-1%, -1%, 0); }
                }

                @keyframes pcgm-float {
                    0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
                    50% { transform: translateY(-16px) rotate(calc(var(--r, 0deg) + 8deg)); }
                }

                @keyframes pcgm-drift {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(24px, -28px); }
                }

                @keyframes pcgm-pulse-ring {
                    0% { box-shadow: 0 0 0 0 rgba(141, 198, 69, 0.55); }
                    100% { box-shadow: 0 0 0 8px rgba(141, 198, 69, 0); }
                }

                .pcgm-bg-photo {
                    animation: pcgm-kenburns 22s ease-in-out infinite alternate;
                }

                .pcgm-leaf {
                    position: absolute;
                    animation: pcgm-float 9s ease-in-out infinite;
                }

                .pcgm-orb {
                    position: absolute;
                    border-radius: 9999px;
                    filter: blur(48px);
                    animation: pcgm-drift 16s ease-in-out infinite;
                }

                .pcgm-live-dot {
                    animation: pcgm-pulse-ring 2s ease-out infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                    .pcgm-bg-photo,
                    .pcgm-leaf,
                    .pcgm-orb,
                    .pcgm-live-dot {
                        animation: none !important;
                    }
                }
            `}</style>

            {/* ---------- BRAND PANEL ---------- */}
            <div className="relative hidden h-full flex-col justify-between overflow-hidden p-10 text-white lg:flex">
                <img
                    src="/images/storefront-dusk.jpg"
                    alt=""
                    aria-hidden="true"
                    className="pcgm-bg-photo absolute inset-0 h-full w-full object-cover opacity-55"
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(160deg, rgba(0,167,155,0.35) 0%, rgba(5,41,37,0.75) 45%, var(--ink) 95%)',
                    }}
                />

                {/* ambient drifting color + leaf accents, purely decorative — kept as CSS loops */}
                <div
                    className="pcgm-orb h-56 w-56"
                    style={{ background: 'var(--teal)', opacity: 0.28, top: '-4rem', right: '-3rem' }}
                />
                <div
                    className="pcgm-orb h-64 w-64"
                    style={{
                        background: 'var(--green)',
                        opacity: 0.16,
                        bottom: '-5rem',
                        left: '-4rem',
                        animationDelay: '4s',
                    }}
                />
                <Leaf
                    className="pcgm-leaf h-16 w-16 text-[var(--green)]/20"
                    style={{ top: '22%', right: '12%', animationDelay: '0.5s' }}
                />
                <Leaf
                    className="pcgm-leaf h-10 w-10 text-white/15"
                    style={{ top: '55%', right: '28%', animationDelay: '2.5s' }}
                />
                <Leaf
                    className="pcgm-leaf h-12 w-12 text-[var(--teal)]/25"
                    style={{ bottom: '30%', left: '8%', animationDelay: '1.2s' }}
                />

                <motion.div
                    className="relative z-20 flex items-center justify-between gap-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: easeOut }}
                >
                    <Link href={home()} className="flex items-center gap-3">
                        <img src="/images/pcgm_logo.png" alt="" className="h-10 w-10 object-contain" />
                        <span className="text-lg font-bold tracking-tight">People&rsquo;s Coop Gen. Mdse.</span>
                    </Link>

                    <motion.div
                        className="hidden flex-col items-end text-right sm:flex"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: easeOut }}
                    >
                        <div className="flex items-center gap-1.5 text-xs text-white/70">
                            <span className="pcgm-live-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--green)' }} />
                            {dateLabel}
                        </div>
                        <span className="text-sm font-medium tabular-nums">{timeLabel}</span>
                    </motion.div>
                </motion.div>

                {/* ---------- QUICK FACTS ---------- */}
                <motion.div
                    className="relative z-20 -mt-2 flex flex-wrap gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
                >
                    {QUICK_FACTS.map((fact) => (
                        <span
                            key={fact}
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/85"
                        >
                            {fact}
                        </span>
                    ))}
                </motion.div>

                {/* ---------- ROTATING SYSTEM FEATURE ---------- */}
                <div className="relative z-20 flex flex-col gap-5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={featureIndex}
                            className="flex flex-col gap-3"
                            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
                            transition={{ duration: 0.4, ease: easeOut }}
                        >
                            <span
                                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                                style={{ background: 'var(--green)', color: 'var(--ink)' }}
                            >
                                {String(featureIndex + 1).padStart(2, '0')}
                            </span>
                            <div>
                                <h2 className="text-2xl leading-snug font-semibold">
                                    {feature.title}
                                </h2>
                                <p className="mt-2 max-w-sm text-sm text-white/75">
                                    {feature.body}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex items-center gap-1.5" role="tablist" aria-label="System features">
                        {FEATURES.map((p, i) => (
                            <button
                                key={p.title}
                                type="button"
                                role="tab"
                                aria-selected={i === featureIndex}
                                aria-label={`Show feature ${i + 1}: ${p.title}`}
                                onClick={() => setFeatureIndex(i)}
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                    width: i === featureIndex ? '1.5rem' : '0.375rem',
                                    background:
                                        i === featureIndex
                                            ? 'var(--green)'
                                            : 'rgba(255,255,255,0.35)',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* ---------- GROUNDING TAGLINE ---------- */}
                <div className="relative z-20 flex items-end justify-between gap-6">
                    <p className="text-xs tracking-[0.15em] text-[var(--green)] uppercase">
                        One Coop. One Store.
                        <br />
                        One Community. One Future.
                    </p>
                </div>
            </div>

            {/* ---------- FORM PANEL ---------- */}
            <div className="flex h-full w-full flex-col self-stretch overflow-y-auto bg-[var(--paper,#f4faf8)] lg:bg-white">
                {/* mobile-only brand bar — on lg the left panel already covers this */}
                <div
                    className="flex items-center justify-center gap-2 px-6 py-5 text-white lg:hidden"
                    style={{ background: 'linear-gradient(135deg, var(--ink) 0%, #0a3a33 100%)' }}
                >
                    <img src="/images/pcgm_logo.png" alt="" className="h-8 w-8 object-contain" />
                    <span className="text-sm font-bold tracking-tight">People&rsquo;s Coop Gen. Mdse.</span>
                </div>

                <motion.div
                    className="flex flex-1 items-center justify-center p-6 lg:p-8"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: easeOut }}
                >
                    <div className="w-full sm:w-[380px]">
                        <Link
                            href={home()}
                            className="relative z-20 mb-6 hidden items-center justify-center gap-2 lg:flex"
                        >
                            <img src="/images/pcgm_logo.png" alt="" className="h-9 w-9 object-contain" />
                            <span className="font-bold tracking-tight">People&rsquo;s Coop Gen. Mdse.</span>
                        </Link>

                        <div className="rounded-xl border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(5,41,37,0.04),0_12px_32px_-12px_rgba(5,41,37,0.18)] sm:p-8">
                            <div
                                className="-mx-6 -mt-6 mb-6 h-1 rounded-t-xl sm:-mx-8 sm:-mt-8"
                                style={{ background: 'linear-gradient(90deg, var(--teal) 0%, var(--green) 100%)' }}
                            />
                            <div className="mb-6 flex flex-col items-start gap-1.5 text-left">
                                <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">{title}</h1>
                                <p className="text-sm text-balance text-muted-foreground">{description}</p>
                            </div>
                            {children}
                        </div>

                        <div className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5 text-[var(--teal)]" />
                            Access restricted to authorized PCGM staff. Contact IT for account issues.
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
