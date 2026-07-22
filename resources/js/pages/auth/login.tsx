import { Form, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

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

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />

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

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <motion.div
                            className="grid gap-6"
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
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="border-black/10 bg-[#f4faf8] text-[#052925] placeholder:text-[#052925]/40 focus-visible:border-[#00a79b] focus-visible:ring-[#00a79b]/25"
                                />
                                <InputError message={errors.email} />
                            </motion.div>

                            <motion.div variants={item} className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm text-[#00a79b] decoration-[#00a79b]/40"
                                            tabIndex={5}
                                        >
                                            Forgot your password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className="border-black/10 bg-[#f4faf8] text-[#052925] placeholder:text-[#052925]/40 focus-visible:border-[#00a79b] focus-visible:ring-[#00a79b]/25"
                                />
                                <InputError message={errors.password} />
                            </motion.div>

                            <motion.div
                                variants={item}
                                className="flex items-center space-x-3"
                            >
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="border-black/10 bg-[#f4faf8] text-[#052925] placeholder:text-[#052925]/40 focus-visible:border-[#00a79b] focus-visible:ring-[#00a79b]/25"
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </motion.div>

                            <motion.div
                                variants={item}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    type="submit"
                                    className="mt-4 w-full bg-[#00a79b] text-white hover:bg-[#00a79b]/90"
                                    tabIndex={4}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing && <Spinner />}
                                    Log in
                                </Button>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            className="text-center text-sm text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.35 }}
                        >
                            Don't have an account?{' '}
                            <TextLink
                                href={register()}
                                className="text-[#00a79b] decoration-[#00a79b]/40"
                                tabIndex={5}
                            >
                                Sign up
                            </TextLink>
                        </motion.div>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
