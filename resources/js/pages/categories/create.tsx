import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, FolderPlus } from 'lucide-react';
import CategoryFormFields from '@/components/categories/category-form-fields';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import categories from '@/routes/categories';

interface ParentOption {
    id: number;
    name: string;
}

export default function CreateCategory({
    parentOptions,
}: {
    parentOptions: ParentOption[];
}) {
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

            <div
                className="mx-auto max-w-xl p-3 pb-28 sm:p-6 sm:pb-6"
                style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-3 -ml-2 gap-1.5 text-muted-foreground"
                >
                    <Link href={categories.index().url}>
                        <ArrowLeft className="size-4" />
                        Categories
                    </Link>
                </Button>

                <Card className="animate-in shadow-sm duration-300 fade-in-0 slide-in-from-bottom-2">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)] ring-1 ring-[var(--pos-teal)]/15">
                                <FolderPlus className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">
                                    Add Category
                                </CardTitle>
                                <CardDescription>
                                    Group products together for browsing and
                                    reporting.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <CategoryFormFields
                                data={data}
                                setData={setData}
                                errors={errors}
                                parentOptions={parentOptions}
                            />

                            {/* On mobile, actions pin to the bottom of the viewport so they stay
                                reachable no matter how far the form scrolls; on larger screens
                                they sit inline right after the fields as before. */}
                            <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:static sm:z-auto sm:mt-6 sm:flex-row-reverse sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:flex-1"
                                >
                                    {processing ? 'Saving…' : 'Save Category'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                    className="sm:flex-1"
                                >
                                    <Link href={categories.index().url}>
                                        Cancel
                                    </Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
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
