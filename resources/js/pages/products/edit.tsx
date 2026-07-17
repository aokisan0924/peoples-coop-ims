import { Head, useForm, Link } from '@inertiajs/react';
import ProductFormFields from '@/components/products/product-form-fields';
import { Button } from '@/components/ui/button';
import { type Product } from '@/types/inventory';
import products from '@/routes/products';

interface Option {
    id: number;
    name: string;
    abbreviation?: string;
}

export default function EditProduct({
    product,
    categories,
    units,
}: {
    product: Product;
    categories: Option[];
    units: Option[];
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: product.name,
        barcode: product.barcode ?? '',
        category_id: product.category_id,
        base_unit_id: product.base_unit_id,
        pack_unit_id: product.pack_unit_id,
        pack_conversion_factor: product.pack_conversion_factor,
        cost_price: product.cost_price,
        markup_percentage: product.markup_percentage,
        low_stock_threshold: product.low_stock_threshold,
        is_active: product.is_active,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(products.update(product.id).url);
    }

    return (
        <>
            <Head title="Edit Product" />

            <div className="max-w-2xl p-4">
                <h1 className="text-xl font-semibold mb-4">Edit Product</h1>

                <form onSubmit={handleSubmit}>
                    <ProductFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        categories={categories}
                        units={units}
                        isEdit
                    />

                    <div className="flex gap-2 mt-6">
                        <Button type="submit" disabled={processing}>
                            Update Product
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

EditProduct.layout = {
    breadcrumbs: [
        { title: 'Products', href: products.index().url },
        { title: 'Edit Product', href: '#' },
    ],
};