import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SupplierFormData {
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    payment_terms: string;
}

interface Props {
    data: SupplierFormData;
    setData: <K extends keyof SupplierFormData>(key: K, value: SupplierFormData[K]) => void;
    errors: Partial<Record<keyof SupplierFormData, string>>;
}

export default function SupplierFormFields({ data, setData, errors }: Props) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Golden Harvest Trading"
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                    id="contact_person"
                    value={data.contact_person}
                    onChange={(e) => setData('contact_person', e.target.value)}
                />
                {errors.contact_person && <p className="text-sm text-red-600 mt-1">{errors.contact_person}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                    />
                    {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                </div>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                </div>
            </div>

            <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                    id="address"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                />
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
            </div>

            <div>
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input
                    id="payment_terms"
                    value={data.payment_terms}
                    onChange={(e) => setData('payment_terms', e.target.value)}
                    placeholder="e.g. COD, Net 15, Net 30"
                />
                {errors.payment_terms && <p className="text-sm text-red-600 mt-1">{errors.payment_terms}</p>}
            </div>
        </div>
    );
}