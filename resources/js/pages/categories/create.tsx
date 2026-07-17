import { Head, useForm, Link } from '@inertiajs/react';
import CategoryFormFields from '@/components/categories/category-form-fields';
import { Button } from '@/components/ui/button';
import categories from '@/routes/categories';

interface ParentOption {
    id: number;
    name: string;
}

export default function CreateCategory({ parentOptions }: { parentOptions: ParentOption[] }) {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        parent_id: number | null;
    }>({
        name: '',
        parent_id: null,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(categories.store().url);
    }

    return (
        <>
            <Head title="Add Category" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Add Category</h1>

                <form onSubmit={handleSubmit}>
                    <CategoryFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        parentOptions={parentOptions}
                    />

                    <div className="flex gap-2 mt-6">
                        <Button type="submit" disabled={processing}>
                            Save Category
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

CreateCategory.layout = {
    breadcrumbs: [
        { title: 'Categories', href: categories.index().url },
        { title: 'Add Category', href: categories.create().url },
    ],
};