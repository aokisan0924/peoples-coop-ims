import { Form, Head } from '@inertiajs/react';
import { Lock, Save } from 'lucide-react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
};

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <div style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <div className="space-y-8">
                <div>
                    <Heading
                        icon={Lock}
                        variant="small"
                        title="Update password"
                        description="Ensure your account is using a long, random password to stay secure"
                    />

                    <div className="mt-4 rounded-xl border bg-card p-4 sm:p-6">
                        <Form
                            {...SecurityController.update.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            resetOnError={['password', 'password_confirmation', 'current_password']}
                            resetOnSuccess
                            onError={(errors) => {
                                if (errors.password) {
                                    passwordInput.current?.focus();
                                }

                                if (errors.current_password) {
                                    currentPasswordInput.current?.focus();
                                }
                            }}
                        >
                            {({ errors, processing }) => (
                                <div className="space-y-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="current_password">Current password</Label>
                                        <div className="relative">
                                            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <PasswordInput
                                                id="current_password"
                                                ref={currentPasswordInput}
                                                name="current_password"
                                                className="pl-9"
                                                autoComplete="current-password"
                                                placeholder="Current password"
                                            />
                                        </div>
                                        <InputError message={errors.current_password} />
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">New password</Label>
                                            <div className="relative">
                                                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <PasswordInput
                                                    id="password"
                                                    ref={passwordInput}
                                                    name="password"
                                                    className="pl-9"
                                                    autoComplete="new-password"
                                                    placeholder="New password"
                                                    passwordrules={props.passwordRules}
                                                />
                                            </div>
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">Confirm password</Label>
                                            <div className="relative">
                                                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <PasswordInput
                                                    id="password_confirmation"
                                                    name="password_confirmation"
                                                    className="pl-9"
                                                    autoComplete="new-password"
                                                    placeholder="Confirm password"
                                                    passwordrules={props.passwordRules}
                                                />
                                            </div>
                                            <InputError message={errors.password_confirmation} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 border-t pt-5">
                                        <Button
                                            disabled={processing}
                                            data-test="update-password-button"
                                            className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                        >
                                            <Save className="size-4" />
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
