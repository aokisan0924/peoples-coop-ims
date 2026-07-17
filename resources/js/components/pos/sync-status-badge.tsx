import { useEffect, useState } from 'react';
import { syncEngine, type SyncStatus } from '@/lib/sync-engine';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

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

    if (!status.isOnline) {
        return (
            <Badge variant="destructive" className="gap-1">
                <WifiOff className="size-3" />
                Offline {status.pendingCount > 0 && `— ${status.pendingCount} pending`}
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

    if (status.lastError) {
        return (
            <Badge variant="destructive" className="gap-1">
                Sync issue — needs review
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <Wifi className="size-3" />
            Online — Synced
        </Badge>
    );
}
