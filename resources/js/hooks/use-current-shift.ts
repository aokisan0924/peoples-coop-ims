import { useState, useEffect, useCallback } from 'react';

export interface ShiftSession {
    id: number;
    starting_cash: string;
    status: 'open' | 'closed';
    opened_at: string;
}

export function useCurrentShift() {
    const [shift, setShift] = useState<ShiftSession | null>(null);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/shift/current');
            const data = await res.json();
            setShift(data.shift);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { shift, loading, refetch };
}
