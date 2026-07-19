import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { syncEngine, type SyncStatus } from '@/lib/sync-engine';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function SyncStatusBadge() {
    const [status, setStatus] = useState<SyncStatus>({
        isOnline: navigator.onLine,
        pendingCount: 0,
        syncing: false,
        lastError: null,
    });

    useEffect(() => {
        return syncEngine.subscribe(setStatus);
    }, []);

    // Any state worth clicking through to the review page for
    const isClickable = !status.isOnline || status.pendingCount > 0 || status.lastError;

    const badge = (() => {
        if (!status.isOnline) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <WifiOff className="size-3" />
                    Offline {status.pendingCount > 0 && `— ${status.pendingCount} pending`}
                </Badge>
            );
        }

        if (status.lastError) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="size-3" />
                    Sync issue — review needed
                </Badge>
            );
        }

        if (status.syncing || status.pendingCount > 0) {
            return (
                <Badge variant="secondary" className="gap-1">
                    <RefreshCw className={`size-3 ${status.syncing ? 'animate-spin' : ''}`} />
                    Syncing {status.pendingCount} sale{status.pendingCount !== 1 ? 's' : ''}...
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                <Wifi className="size-3" />
                Online — Synced
            </Badge>
        );
    })();

    if (isClickable) {
        return (
            <Link href="/pos/sync-review" className="hover:opacity-80 transition-opacity">
                {badge}
            </Link>
        );
    }

    return badge;
}
