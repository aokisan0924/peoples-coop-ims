import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronDown,
    FolderTree,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import categories from '@/routes/categories';
import type { Category } from '@/types/inventory';

type CategoryWithChildren = Category & { childCategories: Category[] };

export default function CategoriesIndex({
    categories: categoryList,
}: {
    categories: Category[];
}) {
    const [query, setQuery] = useState('');
    const [activeGroup, setActiveGroup] = useState('All');
    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

    function handleDelete(category: Category) {
        if (
            confirm(
                `Remove category "${category.name}"? This cannot be undone.`,
            )
        ) {
            router.delete(categories.destroy(category.id).url);
        }
    }

    function toggleCollapsed(id: number) {
        setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    // The API returns a flat, alphabetically-sorted list — a category and its
    // parent can land far apart in that order. Group them here so a parent and
    // its subcategories always render together, instead of relying on an "↳"
    // hint that only made sense if they happened to sort next to each other.
    const tree = useMemo<CategoryWithChildren[]>(() => {
        const byId = new Map(categoryList.map((c) => [c.id, c]));
        const childrenByParent = new Map<number, Category[]>();
        const consumed = new Set<number>();

        categoryList.forEach((c) => {
            if (c.parent_id && byId.has(c.parent_id)) {
                const list = childrenByParent.get(c.parent_id) ?? [];
                list.push(c);
                childrenByParent.set(c.parent_id, list);
            }
        });

        const sortByName = (a: Category, b: Category) =>
            a.name.localeCompare(b.name);

        const roots = categoryList
            .filter((c) => !c.parent_id)
            .sort(sortByName)
            .map((root) => {
                consumed.add(root.id);
                const kids = (childrenByParent.get(root.id) ?? []).sort(
                    sortByName,
                );
                kids.forEach((k) => consumed.add(k.id));

                return { ...root, childCategories: kids };
            });

        // Defensive fallback: a category whose parent reference is missing or
        // itself nested (shouldn't happen — the form only offers top-level
        // categories as parents — but don't silently hide data if it does).
        const orphans = categoryList
            .filter((c) => !consumed.has(c.id))
            .sort(sortByName)
            .map((c) => ({ ...c, childCategories: [] }));

        return [...roots, ...orphans];
    }, [categoryList]);

    // Quick-filter chips — one per top-level group, so a large catalog can be
    // narrowed to a single branch at a glance instead of scanning the whole grid.
    const groupNames = useMemo(
        () => ['All', ...tree.map((r) => r.name)],
        [tree],
    );

    const searchResults = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (q === '') {
            return null;
        }

        return categoryList
            .filter((c) => c.name.toLowerCase().includes(q))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [categoryList, query]);

    const visibleTree = useMemo(
        () =>
            activeGroup === 'All'
                ? tree
                : tree.filter((r) => r.name === activeGroup),
        [tree, activeGroup],
    );

    const isEmpty = categoryList.length === 0;

    return (
        <div
            className="cat-manager"
            style={
                {
                    '--pos-teal': '#00a79b',
                    '--pos-green': '#8dc645',
                } as React.CSSProperties
            }
        >
            <Head title="Categories" />

            <div className="mx-auto max-w-[1600px] pb-24 sm:pb-8">
                {/* Sticky toolbar — mirrors the POS catalog header so the two areas of
                    the app feel like one product, and stays reachable on long lists. */}
                <div className="sticky top-0 z-10 space-y-3 border-b bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:p-4">
                    <div className="flex items-center gap-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold tracking-tight">
                                    Categories
                                </h1>
                                {!isEmpty && (
                                    <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)] dark:text-[var(--pos-green)]">
                                        {categoryList.length}
                                    </Badge>
                                )}
                            </div>
                            <p className="hidden text-sm text-muted-foreground sm:block">
                                Organize your catalog into groups and subgroups.
                            </p>
                        </div>
                        <div className="ml-auto">
                            <Button
                                asChild
                                className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                            >
                                <Link href={categories.create().url}>
                                    <Plus className="size-4" />
                                    <span className="hidden sm:inline">
                                        Add Category
                                    </span>
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {!isEmpty && (
                        <>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search categories…"
                                    className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                />
                            </div>

                            {searchResults === null &&
                                groupNames.length > 2 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {groupNames.map((name) => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() =>
                                                    setActiveGroup(name)
                                                }
                                                className={cn(
                                                    'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                                                    activeGroup === name
                                                        ? 'border-[var(--pos-teal)] bg-[var(--pos-teal)] text-white'
                                                        : 'text-muted-foreground hover:bg-muted',
                                                )}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                        </>
                    )}
                </div>

                <div className="p-3 sm:p-4">
                    {isEmpty && (
                        <EmptyState
                            icon={<FolderTree className="size-8" />}
                            title="No categories yet"
                            description='Add your first one to start organizing products (e.g. "Grocery", "Hardware").'
                            action={
                                <Button
                                    asChild
                                    size="sm"
                                    className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                >
                                    <Link href={categories.create().url}>
                                        <Plus className="size-4" />
                                        Add Category
                                    </Link>
                                </Button>
                            }
                        />
                    )}

                    {!isEmpty && searchResults !== null && (
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                            {searchResults.length === 0 ? (
                                <div className="sm:col-span-2 xl:col-span-3">
                                    <EmptyState
                                        icon={<Search className="size-8" />}
                                        title="No categories match"
                                        description={`Nothing found for "${query}".`}
                                    />
                                </div>
                            ) : (
                                searchResults.map((category) => (
                                    <div
                                        key={category.id}
                                        className="overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <CategoryRow
                                            category={category}
                                            onDelete={handleDelete}
                                            showParentBadge
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {!isEmpty && searchResults === null && (
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                layout
                                className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3"
                            >
                                {visibleTree.map((root) => {
                                    const hasChildren =
                                        root.childCategories.length > 0;
                                    const isCollapsed =
                                        collapsed[root.id] ?? false;

                                    return (
                                        <motion.div
                                            key={root.id}
                                            layout
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="h-fit overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:border-[var(--pos-teal)]/40 hover:shadow-md"
                                        >
                                            <CategoryRow
                                                category={root}
                                                onDelete={handleDelete}
                                                childCount={
                                                    hasChildren
                                                        ? root.childCategories
                                                              .length
                                                        : undefined
                                                }
                                                collapsed={isCollapsed}
                                                onToggleCollapsed={
                                                    hasChildren
                                                        ? () =>
                                                              toggleCollapsed(
                                                                  root.id,
                                                              )
                                                        : undefined
                                                }
                                            />
                                            <AnimatePresence initial={false}>
                                                {hasChildren &&
                                                    !isCollapsed && (
                                                        <motion.div
                                                            initial={{
                                                                height: 0,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                height: 'auto',
                                                                opacity: 1,
                                                            }}
                                                            exit={{
                                                                height: 0,
                                                                opacity: 0,
                                                            }}
                                                            transition={{
                                                                duration: 0.15,
                                                            }}
                                                            className="space-y-1 border-t bg-muted/30 p-2 pl-4"
                                                        >
                                                            {root.childCategories.map(
                                                                (child) => (
                                                                    <div
                                                                        key={
                                                                            child.id
                                                                        }
                                                                        className="border-l-2 pl-3"
                                                                    >
                                                                        <CategoryRow
                                                                            category={
                                                                                child
                                                                            }
                                                                            onDelete={
                                                                                handleDelete
                                                                            }
                                                                            compact
                                                                        />
                                                                    </div>
                                                                ),
                                                            )}
                                                        </motion.div>
                                                    )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Floating action button — keeps "Add Category" within thumb reach on
                mobile, matching the POS's own fixed bottom action affordance. */}
            {!isEmpty && (
                <Button
                    asChild
                    size="icon"
                    className="fixed right-4 bottom-4 z-20 size-12 rounded-full bg-[var(--pos-teal)] text-white shadow-lg shadow-black/20 hover:bg-[var(--pos-teal)]/90 sm:hidden"
                >
                    <Link
                        href={categories.create().url}
                        aria-label="Add Category"
                    >
                        <Plus className="size-5" />
                    </Link>
                </Button>
            )}
        </div>
    );
}

function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {icon}
            </div>
            <p className="text-sm font-medium">{title}</p>
            <p className="max-w-xs text-sm text-muted-foreground">
                {description}
            </p>
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

function CategoryRow({
    category,
    onDelete,
    compact = false,
    showParentBadge = false,
    childCount,
    collapsed = false,
    onToggleCollapsed,
}: {
    category: Category;
    onDelete: (category: Category) => void;
    compact?: boolean;
    showParentBadge?: boolean;
    childCount?: number;
    collapsed?: boolean;
    onToggleCollapsed?: () => void;
}) {
    return (
        <div
            className={cn(
                'flex items-center justify-between gap-3 rounded-lg',
                compact ? 'py-1.5' : 'p-3 sm:p-4',
            )}
        >
            <button
                type="button"
                onClick={onToggleCollapsed}
                disabled={!onToggleCollapsed}
                className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 text-left',
                    onToggleCollapsed && 'cursor-pointer',
                )}
            >
                {onToggleCollapsed && (
                    <ChevronDown
                        className={cn(
                            'size-4 shrink-0 text-[var(--pos-teal)] transition-transform',
                            collapsed && '-rotate-90',
                        )}
                    />
                )}
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p
                            className={cn(
                                'truncate font-medium',
                                compact && 'text-sm',
                            )}
                        >
                            {category.name}
                        </p>
                        {childCount !== undefined && (
                            <Badge
                                variant="outline"
                                className="shrink-0 font-normal text-muted-foreground"
                            >
                                {childCount}
                            </Badge>
                        )}
                    </div>
                    {showParentBadge && category.parent && (
                        <Badge className="mt-1 border-0 bg-[var(--pos-green)]/15 text-[var(--pos-green)]">
                            under {category.parent.name}
                        </Badge>
                    )}
                </div>
            </button>
            <div className="flex shrink-0 gap-1.5">
                <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                >
                    <Link href={categories.edit(category.id).url}>
                        <Pencil className="size-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(category)}
                    className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                    aria-label={`Delete ${category.name}`}
                >
                    <Trash2 className="size-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                </Button>
            </div>
        </div>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [{ title: 'Categories', href: categories.index().url }],
};
