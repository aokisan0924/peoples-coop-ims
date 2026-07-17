import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, Truck, Ruler, Tags, Package, Box, Boxes, ShoppingCart, LineChart } from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
import suppliers from '@/routes/suppliers';
import units from '@/routes/units';
import categories from '@/routes/categories';
import products from '@/routes/products';
import type { NavItem } from '@/types';
import stockBatches from '@/routes/stock-batches';
import pos from '@/routes/pos';
import reports from '@/routes/reports';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Reports',
        href: reports.sales(),
        icon: LineChart,
    },
    {
        title: 'Point of Sale',
        href: pos.index(),
        icon: ShoppingCart,
    },
    {
        title: 'Products',
        href: products.index(),
        icon: Package,
    },
    {
        title: 'Stock Batch',
        href: stockBatches.index(),
        icon: Boxes,
    },
    {
        title: 'Categories',
        href: categories.index(),
        icon: Tags,
    },
    {
        title: 'Units',
        href: units.index(),
        icon: Ruler,
    },
    {
        title: 'Suppliers',
        href: suppliers.index(),
        icon: Truck,
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
                <NavMain items={mainNavItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}