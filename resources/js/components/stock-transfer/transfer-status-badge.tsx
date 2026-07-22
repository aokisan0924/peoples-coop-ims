import { Badge } from '@/components/ui/badge';

export default function TransferStatusBadge({ status }: { status: 'in_transit' | 'received' | 'cancelled' }) {
    if (status === 'in_transit') {
        return <Badge className="bg-amber-500 hover:bg-amber-600">In Transit</Badge>;
    }

    if (status === 'received') {
        return <Badge className="bg-green-600 hover:bg-green-700">Received</Badge>;
    }

    return <Badge variant="destructive">Cancelled</Badge>;
}
