// Components
import { Form, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { email } from '@/routes/password';

const easeOut = [0.16, 1, 0.3, 1] as const;

const container = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot password" />

            {status && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mb-4 text-center text-sm font-medium text-green-600"
                >
                    {status}
                </motion.div>
            )}

            <div className="space-y-6">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={item} className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                    className="border-black/10 bg-[#f4faf8] text-[#052925] placeholder:text-[#052925]/40 focus-visible:border-[#00a79b] focus-visible:ring-[#00a79b]/25"
                                />

                                <InputError message={errors.email} />
                            </motion.div>

                            <motion.div
                                variants={item}
                                className="my-6 flex items-center justify-start"
                            >
                                <motion.div
                                    className="w-full"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        className="w-full bg-[#00a79b] text-white hover:bg-[#00a79b]/90"
                                        disabled={processing}
                                        data-test="email-password-reset-link-button"
                                    >
                                        {processing && (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        )}
                                        Email password reset link
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}
                </Form>

                <motion.div
                    className="space-x-1 text-center text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <span>Or, return to</span>
                    <TextLink
                        href={login()}
                        className="text-[#00a79b] decoration-[#00a79b]/40"
                    >
                        log in
                    </TextLink>
                </motion.div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Enter your email to receive a password reset link',
};
