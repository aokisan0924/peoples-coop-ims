import { Head, Link, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
    Boxes,
    Building2,
    Home,
    Receipt,
    ShieldCheck,
    ShoppingCart,
    Users,
    Wallet,
    WifiOff,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboard, login } from '@/routes';

const modules = [
    {
        icon: ShoppingCart,
        title: 'Point of Sale',
        body: 'Ring up sales at the counter — barcode scan or search.',
    },
    {
        icon: Boxes,
        title: 'Inventory',
        body: 'Stock tracked by batch, with low-stock and expiry alerts.',
    },
    {
        icon: Building2,
        title: 'Branches',
        body: 'Every location, its stock and sales, in one place.',
    },
    {
        icon: Wallet,
        title: 'GCash Float',
        body: 'Cash-in, cash-out, and float reconciled per shift.',
    },
    {
        icon: Receipt,
        title: 'Sales & Reports',
        body: 'Daily totals, per-item sales, and void history.',
    },
    {
        icon: ShieldCheck,
        title: 'Roles & Access',
        body: 'Owner, Manager, and Cashier each see what they need.',
    },
];

const pillars = [
    { icon: Users, title: 'Your Coop.', body: 'Stronger together.' },
    {
        icon: ShoppingCart,
        title: 'Your Store.',
        body: 'Better choices, everyday.',
    },
    {
        icon: Home,
        title: 'Your Community.',
        body: 'Growing for a better tomorrow.',
    },
];

// ---------- Motion variants ----------
const easeOut = [0.16, 1, 0.3, 1] as const;

const heroContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.09, delayChildren: 0.05 },
    },
};

const heroItem: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

const gridContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const gridItem: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: easeOut },
    },
};

function useGreeting() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        // Render null on first paint (matches a possible SSR pass with no
        // client clock), then set the real time once mounted client-side.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNow(new Date());

        const id = setInterval(() => setNow(new Date()), 1000 * 30);

        return () => clearInterval(id);
    }, []);

    if (!now) {
        return { greeting: 'Magandang araw', time: '' };
    }

    const hour = now.getHours();
    const greeting =
        hour < 12
            ? 'Good morning'
            : hour < 18
              ? 'Good afternoon'
              : 'Good evening';
    const time = now.toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return { greeting, time };
}

export default function Welcome() {
    const { auth } = usePage().props;
    const { greeting, time } = useGreeting();
    const prefersReducedMotion = useReducedMotion();

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
                <motion.header
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: easeOut }}
                    className="border-b border-[var(--ink-line)]"
                >
                    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/pcgm_logo.png"
                                alt="People's Coop Gen. Mdse."
                                className="h-10 w-10 object-contain"
                            />
                            <div className="leading-tight">
                                <p className="font-display text-sm font-extrabold tracking-tight sm:text-base">
                                    People&rsquo;s Coop Gen. Mdse.
                                </p>
                                <p className="font-mono text-[10px] tracking-wide text-[var(--paper-dim)] uppercase opacity-70">
                                    Internal system
                                </p>
                            </div>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <Link
                                href={auth.user ? dashboard() : login()}
                                className="rounded-sm bg-[var(--teal)] px-5 py-2 text-sm font-semibold text-[var(--ink)] transition-opacity hover:opacity-90"
                            >
                                {auth.user ? 'Go to dashboard' : 'Log in'}
                            </Link>
                        </motion.div>
                    </nav>
                </motion.header>

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
                        <motion.div
                            variants={heroContainer}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.p
                                variants={heroItem}
                                className="font-mono text-xs tracking-[0.2em] text-[var(--green)] uppercase"
                            >
                                {greeting}
                                {time ? ` · ${time}` : ''}
                            </motion.p>
                            <motion.h1
                                variants={heroItem}
                                className="font-display mt-4 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl"
                            >
                                One system.
                                <br />
                                Every branch, in sync.
                            </motion.h1>
                            <motion.p
                                variants={heroItem}
                                className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--paper-dim)]"
                            >
                                The point-of-sale, inventory, and branch system
                                of People&rsquo;s Coop General Merchandise,
                                under People&rsquo;s Multi-Purpose Cooperative.
                                Log in with your staff account to open the
                                counter, check stock, or review sales — whatever
                                your role covers.
                            </motion.p>
                            <motion.div
                                variants={heroItem}
                                className="mt-8 flex flex-wrap items-center gap-4"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <Link
                                        href={auth.user ? dashboard() : login()}
                                        className="inline-flex items-center gap-2 rounded-sm bg-[var(--teal)] px-6 py-3 text-sm font-semibold text-[var(--ink)]"
                                    >
                                        {auth.user
                                            ? 'Go to dashboard'
                                            : 'Log in to continue'}
                                    </Link>
                                </motion.div>
                                <span className="flex items-center gap-2 text-xs text-[var(--paper-dim)] opacity-70">
                                    <WifiOff className="h-3.5 w-3.5" />
                                    Works at the counter even when the signal
                                    doesn't
                                </span>
                            </motion.div>
                            <motion.p
                                variants={heroItem}
                                className="mt-10 font-mono text-xs text-[var(--paper-dim)] opacity-50"
                            >
                                No account yet? Ask your branch manager to set
                                one up for you.
                            </motion.p>
                            <motion.p
                                variants={heroItem}
                                className="mt-2 font-mono text-[11px] tracking-[0.15em] text-[var(--green)] uppercase opacity-70"
                            >
                                One Coop. One Store. One Community. One Future.
                            </motion.p>
                        </motion.div>

                        {/* Signature: hub + branch diagram, receipt-tab styled */}
                        <motion.div
                            className="drift relative"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.7,
                                ease: easeOut,
                                delay: 0.2,
                            }}
                        >
                            <svg
                                viewBox="0 0 420 320"
                                className="w-full"
                                role="img"
                                aria-label="Dashboard connected to three branch tills"
                            >
                                <motion.line
                                    x1="120"
                                    y1="160"
                                    x2="330"
                                    y2="60"
                                    stroke="var(--green)"
                                    strokeWidth="1.5"
                                    className="hub-line"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{
                                        duration: 0.8,
                                        delay: 0.5,
                                        ease: easeOut,
                                    }}
                                />
                                <motion.line
                                    x1="120"
                                    y1="160"
                                    x2="330"
                                    y2="160"
                                    stroke="var(--green)"
                                    strokeWidth="1.5"
                                    className="hub-line"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{
                                        duration: 0.8,
                                        delay: 0.65,
                                        ease: easeOut,
                                    }}
                                />
                                <motion.line
                                    x1="120"
                                    y1="160"
                                    x2="330"
                                    y2="260"
                                    stroke="var(--green)"
                                    strokeWidth="1.5"
                                    className="hub-line"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{
                                        duration: 0.8,
                                        delay: 0.8,
                                        ease: easeOut,
                                    }}
                                />
                                <motion.circle
                                    cx="120"
                                    cy="160"
                                    r="5"
                                    fill="var(--green)"
                                    className="hub-pulse"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.4 }}
                                />
                                <motion.circle
                                    cx="330"
                                    cy="60"
                                    r="4"
                                    fill="var(--teal)"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.4, delay: 1.1 }}
                                />
                                <motion.circle
                                    cx="330"
                                    cy="160"
                                    r="4"
                                    fill="var(--teal)"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.4, delay: 1.25 }}
                                />
                                <motion.circle
                                    cx="330"
                                    cy="260"
                                    r="4"
                                    fill="var(--teal)"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.4, delay: 1.4 }}
                                />

                                <g fontFamily="IBM Plex Mono, ui-monospace, monospace">
                                    <rect
                                        x="20"
                                        y="118"
                                        width="180"
                                        height="84"
                                        rx="2"
                                        fill="var(--paper)"
                                    />
                                    <text
                                        x="36"
                                        y="144"
                                        fontSize="11"
                                        letterSpacing="1"
                                        fill="var(--ink)"
                                        opacity="0.6"
                                    >
                                        ALL BRANCHES — TODAY
                                    </text>
                                    <text
                                        x="36"
                                        y="168"
                                        fontSize="18"
                                        fontWeight="700"
                                        fill="var(--ink)"
                                    >
                                        ₱48,210.00
                                    </text>
                                    <text
                                        x="36"
                                        y="188"
                                        fontSize="10"
                                        fill="var(--teal)"
                                    >
                                        3 branches synced
                                    </text>

                                    <rect
                                        x="290"
                                        y="32"
                                        width="155"
                                        height="56"
                                        rx="2"
                                        fill="var(--paper)"
                                    />
                                    <text
                                        x="302"
                                        y="52"
                                        fontSize="9"
                                        fill="var(--ink)"
                                        opacity="0.6"
                                    >
                                        BRANCH · ISABELA
                                    </text>
                                    <text
                                        x="302"
                                        y="70"
                                        fontSize="13"
                                        fontWeight="700"
                                        fill="var(--ink)"
                                    >
                                        ₱12,040.00
                                    </text>

                                    <rect
                                        x="290"
                                        y="132"
                                        width="155"
                                        height="56"
                                        rx="2"
                                        fill="var(--paper)"
                                    />
                                    <text
                                        x="302"
                                        y="152"
                                        fontSize="9"
                                        fill="var(--ink)"
                                        opacity="0.6"
                                    >
                                        BRANCH · QUEZON CITY
                                    </text>
                                    <text
                                        x="302"
                                        y="170"
                                        fontSize="13"
                                        fontWeight="700"
                                        fill="var(--ink)"
                                    >
                                        ₱19,860.00
                                    </text>

                                    <rect
                                        x="290"
                                        y="232"
                                        width="155"
                                        height="56"
                                        rx="2"
                                        fill="var(--paper)"
                                    />
                                    <text
                                        x="302"
                                        y="252"
                                        fontSize="9"
                                        fill="var(--ink)"
                                        opacity="0.6"
                                    >
                                        BRANCH · PALAYAN CITY
                                    </text>
                                    <text
                                        x="302"
                                        y="270"
                                        fontSize="13"
                                        fontWeight="700"
                                        fill="var(--ink)"
                                    >
                                        ₱16,310.00
                                    </text>
                                </g>
                            </svg>
                        </motion.div>
                    </div>
                </section>

                {/* ---------- PILLARS ---------- */}
                <section className="mx-auto max-w-6xl px-6 py-16">
                    <motion.div
                        className="grid gap-8 sm:grid-cols-3"
                        variants={gridContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.4 }}
                    >
                        {pillars.map((p) => (
                            <motion.div
                                key={p.title}
                                variants={gridItem}
                                className="text-center sm:text-left"
                            >
                                <p.icon
                                    className="mx-auto h-6 w-6 text-[var(--teal)] sm:mx-0"
                                    strokeWidth={1.75}
                                />
                                <h3 className="font-display mt-3 text-lg font-bold">
                                    {p.title}
                                </h3>
                                <p className="mt-1 text-sm text-[var(--paper-dim)] opacity-80">
                                    {p.body}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* ---------- MODULES ---------- */}
                <section className="border-t border-[var(--ink-line)] bg-[var(--ink-2)]">
                    <div className="mx-auto max-w-6xl px-6 py-16">
                        <motion.p
                            className="font-mono text-xs tracking-[0.2em] text-[var(--green)] uppercase"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.6 }}
                            transition={{ duration: 0.4 }}
                        >
                            What's inside
                        </motion.p>
                        <motion.h2
                            className="font-display mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.6 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                        >
                            One login, every part of the job.
                        </motion.h2>

                        <motion.div
                            className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                            variants={gridContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            {modules.map((m) => (
                                <motion.div
                                    key={m.title}
                                    variants={gridItem}
                                    whileHover={
                                        prefersReducedMotion
                                            ? undefined
                                            : {
                                                  y: -4,
                                                  boxShadow:
                                                      '0 12px 28px rgba(0,0,0,0.25)',
                                              }
                                    }
                                    className="perforated rounded-sm bg-[var(--paper)] p-6 pt-8 text-[var(--ink)] shadow-sm"
                                >
                                    <m.icon
                                        className="h-6 w-6 text-[var(--teal)]"
                                        strokeWidth={1.75}
                                    />
                                    <h3 className="font-display mt-4 text-base font-bold">
                                        {m.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed opacity-75">
                                        {m.body}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ---------- FOOTER ---------- */}
                <motion.footer
                    className="border-t border-[var(--ink-line)]"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm md:flex-row md:items-center">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/pcgm_logo.png"
                                alt="People's Coop Gen. Mdse."
                                className="h-6 w-6 object-contain"
                            />
                            <span className="text-[var(--paper-dim)] opacity-70">
                                People&rsquo;s Multi-Purpose Cooperative — for
                                internal use only
                            </span>
                        </div>
                        <span className="font-mono text-xs text-[var(--paper-dim)] opacity-50">
                            Having trouble logging in? Contact the IT
                            department.
                        </span>
                    </div>
                </motion.footer>
            </div>
        </>
    );
}
