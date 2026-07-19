export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-white">
                <img
                    src="/images/pcgm_logo.png"
                    alt=""
                    className="size-6 object-contain"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    People&rsquo;s Coop Gen. Mdse.
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                    Internal system
                </span>
            </div>
        </>
    );
}
