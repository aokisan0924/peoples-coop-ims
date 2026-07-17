import { Head, useForm, Link } from '@inertiajs/react';
import ProductFormFields from '@/components/products/product-form-fields';
import { Button } from '@/components/ui/button';
import products from '@/routes/products';

interface Option {
    id: number;
    name: string;
    abbreviation?: string;
}

export default function CreateProduct({ categories, units }: { categories: Option[]; units: Option[] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        barcode: '',
        category_id: null as number | null,
        base_unit_id: null as number | null,
        pack_unit_id: null as number | null,
        pack_conversion_factor: null as number | null,
        cost_price: '',
        markup_percentage: '18',
        low_stock_threshold: 10,
        is_active: true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(products.store().url);
    }

    return (
        <>
            <Head title="Add Product" />

            <div className="max-w-2xl p-4">
                <h1 className="text-xl font-semibold mb-4">Add Product</h1>

                <form onSubmit={handleSubmit}>
                    <ProductFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        categories={categories}
                        units={units}
                    />

                    <div className="flex gap-2 mt-6">
                        <Button type="submit" disabled={processing}>
                            Save Product
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={products.index().url}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateProduct.layout = {
    breadcrumbs: [
        { title: 'Products', href: products.index().url },
        { title: 'Add Product', href: products.create().url },
    ],
};