import { Link } from '@inertiajs/react';
import {
    ArrowLeftRight,
    Boxes,
    Building2,
    Clock,
    History,
    LayoutGrid,
    Package,
    Receipt,
    Ruler,
    ShoppingCart,
    Tags,
    Truck,
    UserPlus,
    Wallet,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import type { NavItem } from '@/types';
import { dashboard } from '@/routes';
import categories from '@/routes/categories';
import gcash from '@/routes/gcash';
import locations from '@/routes/locations';
import pos from '@/routes/pos';
import products from '@/routes/products';
import sales from '@/routes/sales';
import stockBatches from '@/routes/stock-batches';
import suppliers from '@/routes/suppliers';
import units from '@/routes/units';

// ---------- Overview ----------
const overviewNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

// ---------- Sales & Payments ----------
// Personal → team oversight → payments, in that order: a cashier only sees
// the first two, a manager sees the full operational picture.
const salesNavItems: NavItem[] = [
    {
        title: 'Point of Sale',
        href: pos.index(),
        icon: ShoppingCart,
    },
    {
        title: 'My Sales',
        href: '/my-sales',
        icon: History,
    },
    {
        title: 'Shift History',
        href: '/shifts',
        icon: Clock,
        managerOnly: true,
    },
    {
        title: 'Sales History',
        href: sales.index(),
        icon: Receipt,
        managerOnly: true,
    },
    {
        title: 'GCash Monitor',
        href: gcash.index(),
        icon: Wallet,
    },
];

// ---------- Inventory ----------
// Catalog setup (what a product *is*) first, then stock movement
// (what's physically happening to it), instead of interleaving the two.
const inventoryNavItems: NavItem[] = [
    {
        title: 'Products',
        href: products.index(),
        icon: Package,
        managerOnly: true,
    },
    {
        title: 'Categories',
        href: categories.index(),
        icon: Tags,
        managerOnly: true,
    },
    {
        title: 'Units',
        href: units.index(),
        icon: Ruler,
        managerOnly: true,
    },
    {
        title: 'Suppliers',
        href: suppliers.index(),
        icon: Truck,
        managerOnly: true,
    },
    {
        title: 'Stock Batch',
        href: stockBatches.index(),
        icon: Boxes,
        managerOnly: true,
    },
    {
        title: 'Stock Transfers',
        href: '/stock-transfers',
        icon: ArrowLeftRight,
        managerOnly: true,
    },
];

// ---------- Administration ----------
const adminNavItems: NavItem[] = [
    {
        title: 'Branches',
        href: locations.index(),
        icon: Building2,
        ownerOnly: true,
    },
    {
        title: 'Users',
        href: '/users',
        icon: UserPlus,
        managerOnly: true,
    },
];

function visibleFor(items: NavItem[], isManager: boolean, isOwner: boolean): NavItem[] {
    return items.filter((item) => {
        if (item.ownerOnly) {
            return isOwner;
        }

        // Owner can see everything Manager can.
        if (item.managerOnly) {
            return isManager || isOwner;
        }

        return true;
    });
}

export function AppSidebar() {
    const { isManager, isOwner } = useAuth();

    const overviewItems = visibleFor(overviewNavItems, isManager, isOwner);
    const salesItems = visibleFor(salesNavItems, isManager, isOwner);
    const inventoryItems = visibleFor(inventoryNavItems, isManager, isOwner);
    const adminItems = visibleFor(adminNavItems, isManager, isOwner);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="overflow-x-hidden">
                <NavMain items={overviewItems} label="Overview" />
                <SidebarSeparator />
                <NavMain items={salesItems} label="Sales & Payments" />
                {inventoryItems.length > 0 && <SidebarSeparator />}
                <NavMain items={inventoryItems} label="Inventory" />
                {adminItems.length > 0 && <SidebarSeparator />}
                <NavMain items={adminItems} label="Administration" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
