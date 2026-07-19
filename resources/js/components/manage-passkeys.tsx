import { router } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import Heading from '@/components/heading';
import PasskeyItem from '@/components/passkey-item';
import PasskeyRegistration from '@/components/passkey-register';
import { Badge } from '@/components/ui/badge';
import type { Passkey } from '@/types/auth';

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

const EmptyState = () => {
    return (
        <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <KeyRound className="size-7" />
            </div>
            <p className="text-sm font-medium">No passkeys yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add a passkey to sign in without a password</p>
        </div>
    );
};

export default function ManagePasskeys(props: Props) {
    const passkeys = props.passkeys ?? [];

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(destroy.url(id), {
            preserveScroll: true,
            onError,
        });
    };

    const handleRegisterSuccess = () => {
        router.reload();
    };

    if (!(props.canManagePasskeys ?? false)) {
        return null;
    }

    return (
        <div className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Heading icon={KeyRound} variant="small" title="Passkeys" description="Manage your passkeys for passwordless sign-in" />
                {passkeys.length > 0 && (
                    <Badge className="border-0 bg-[var(--pos-green,#8dc645)]/15 font-normal text-[var(--pos-green,#8dc645)]">{passkeys.length}</Badge>
                )}
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-border">
                {passkeys.length > 0 ? (
                    passkeys.map((passkey) => <PasskeyItem key={passkey.id} passkey={passkey} onDelete={handleDelete} />)
                ) : (
                    <EmptyState />
                )}
            </div>

            <div className="mt-4">
                <PasskeyRegistration onSuccess={handleRegisterSuccess} />
            </div>
        </div>
    );
}
