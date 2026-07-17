import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { type Category } from '@/types/inventory';
import categories from '@/routes/categories';

export default function CategoriesIndex({ categories: categoryList }: { categories: Category[] }) {
    function handleDelete(category: Category) {
        if (confirm(`Remove category "${category.name}"? This cannot be undone.`)) {
            router.delete(categories.destroy(category.id).url);
        }
    }

    return (
        <>
            <Head title="Categories" />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Categories</h1>
                    <Button asChild>
                        <Link href={categories.create().url}>+ Add Category</Link>
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Parent Category</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryList.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                        No categories yet. Add your first one (e.g. Grocery, Hardware).
                                    </td>
                                </tr>
                            )}
                            {categoryList.map((category) => (
                                <tr key={category.id} className="border-t">
                                    <td className="p-3 font-medium">
                                        {category.parent && <span className="text-muted-foreground mr-1">↳</span>}
                                        {category.name}
                                    </td>
                                    <td className="p-3">{category.parent?.name ?? '—'}</td>
                                    <td className="p-3 text-right space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={categories.edit(category.id).url}>Edit</Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(category)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Categories', href: categories.index().url },
    ],
};