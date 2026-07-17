import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type Product } from '@/types/inventory';
import products from '@/routes/products';

export default function ProductsIndex({ products: productList }: { products: Product[] }) {
    function handleDelete(product: Product) {
        if (confirm(`Remove product "${product.name}"? This cannot be undone.`)) {
            router.delete(products.destroy(product.id).url);
        }
    }

    return (
        <>
            <Head title="Products" />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Products</h1>
                    <Button asChild>
                        <Link href={products.create().url}>+ Add Product</Link>
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Barcode</th>
                                <th className="text-left p-3">Category</th>
                                <th className="text-left p-3">Stock</th>
                                <th className="text-left p-3">Member Price</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productList.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                        No products yet. Add your first one.
                                    </td>
                                </tr>
                            )}
                            {productList.map((product) => (
                                <tr key={product.id} className="border-t">
                                    <td className="p-3 font-medium">{product.name}</td>
                                    <td className="p-3 font-mono text-xs">{product.barcode}</td>
                                    <td className="p-3">{product.category?.name ?? '—'}</td>
                                    <td className="p-3">
                                        {product.total_stock}
                                        {product.is_low_stock && (
                                            <Badge variant="destructive" className="ml-2">Low</Badge>
                                        )}
                                    </td>
                                    <td className="p-3">₱{product.member_piece_price?.toFixed(2)}</td>
                                    <td className="p-3 text-right space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={products.edit(product.id).url}>Edit</Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(product)}
                                        >
                                            Delete
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/products/${product.id}/barcode`}>Show Barcode</Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={`/products/${product.id}/label`} target="_blank" rel="noopener noreferrer">
                                                Print
                                            </a>
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

ProductsIndex.layout = {
    breadcrumbs: [
        { title: 'Products', href: products.index().url },
    ],
};