import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, Truck, Ruler, Tags, Package, Boxes, ShoppingCart, Receipt, ReceiptIcon } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
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
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { useAuth } from '@/hooks/use-auth';
import { Wallet } from 'lucide-react';
import { Building2 } from 'lucide-react';
import { UserPlus } from 'lucide-react';
import type { NavItem } from '@/types';
import suppliers from '@/routes/suppliers';
import units from '@/routes/units';
import categories from '@/routes/categories';
import products from '@/routes/products';
import stockBatches from '@/routes/stock-batches';
import pos from '@/routes/pos';
import sales from '@/routes/sales';
import gcash from '@/routes/gcash';
import locations from '@/routes/locations';
import AppLogo from '@/components/app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Point of Sale',
        href: pos.index(),
        icon: ShoppingCart,
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

    {
        title: 'My Sales',
        href: '/my-sales',
        icon: ReceiptIcon,
    },
    {
        title: 'Products',
        href: products.index(),
        icon: Package,
        managerOnly: true,
    },
    {
        title: 'Stock Batch',
        href: stockBatches.index(),
        icon: Boxes,
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

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { isManager, isOwner } = useAuth();
    const visibleNavItems = mainNavItems.filter((item) => {
        if (item.ownerOnly) return isOwner;
        if (item.managerOnly) return isManager || isOwner; // Owner can see everything Manager can
        return true;
    });

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
            <SidebarContent>
                <NavMain items={visibleNavItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
