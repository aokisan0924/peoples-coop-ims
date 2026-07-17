import { Head, useForm, Link } from '@inertiajs/react';
import CategoryFormFields from '@/components/categories/category-form-fields';
import { Button } from '@/components/ui/button';
import { type Category } from '@/types/inventory';
import categories from '@/routes/categories';

interface ParentOption {
    id: number;
    name: string;
}

export default function EditCategory({
    category,
    parentOptions,
}: {
    category: Category;
    parentOptions: ParentOption[];
}) {
    const { data, setData, put, processing, errors } = useForm<{
        name: string;
        parent_id: number | null;
    }>({
        name: category.name,
        parent_id: category.parent_id,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(categories.update(category.id).url);
    }

    return (
        <>
            <Head title="Edit Category" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Edit Category</h1>

                <form onSubmit={handleSubmit}>
                    <CategoryFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        parentOptions={parentOptions}
                    />

                    <div className="flex gap-2 mt-6">
                        <Button type="submit" disabled={processing}>
                            Update Category
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={categories.index().url}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

EditCategory.layout = {
    breadcrumbs: [
        { title: 'Categories', href: categories.index().url },
        { title: 'Edit Category', href: '#' },
    ],
};