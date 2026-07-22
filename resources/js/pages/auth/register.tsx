import { Form, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

const easeOut = [0.16, 1, 0.3, 1] as const;

const container = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.07, delayChildren: 0.05 },
    },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
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
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                    className="border-black/10 bg-[#f4faf8] text-[#052925] placeholder:text-[#052925]/40 focus-visible:border-[#00a79b] focus-visible:ring-[#00a79b]/25"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </motion.div>

                            <motion.div variants={item} className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                    className="border-black/10 bg-[#f4faf8] text-[#052925] placeholder:text-[#052925]/40 focus-visible:border-[#00a79b] focus-visible:ring-[#00a79b]/25"
                                />
                                <InputError message={errors.email} />
                            </motion.div>

                            <motion.div variants={item} className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                    className="border-black/10 bg-[#f4faf8] text-[#052925] placeholder:text-[#052925]/40 focus-visible:border-[#00a79b] focus-visible:ring-[#00a79b]/25"
                                />
                                <InputError message={errors.password} />
                            </motion.div>

                            <motion.div variants={item} className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                    className="border-black/10 bg-[#f4faf8] text-[#052925] placeholder:text-[#052925]/40 focus-visible:border-[#00a79b] focus-visible:ring-[#00a79b]/25"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </motion.div>

                            <motion.div
                                variants={item}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    type="submit"
                                    className="mt-2 w-full bg-[#00a79b] text-white hover:bg-[#00a79b]/90"
                                    tabIndex={5}
                                    data-test="register-user-button"
                                >
                                    {processing && <Spinner />}
                                    Create account
                                </Button>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            className="text-center text-sm text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.35 }}
                        >
                            Already have an account?{' '}
                            <TextLink
                                href={login()}
                                className="text-[#00a79b] decoration-[#00a79b]/40"
                                tabIndex={6}
                            >
                                Log in
                            </TextLink>
                        </motion.div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
