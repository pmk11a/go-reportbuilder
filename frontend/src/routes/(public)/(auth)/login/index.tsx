import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/domains/auth/hooks/use-auth";
import { useAuthStore } from "@/shared/stores/authStore";
import { useToast } from '@/shared/hooks/use-toast';
import { loginSchema, type ILoginInput } from "@/domains/auth/schemas/auth";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/form/input";
import { Button } from "@/shared/ui/overlay/button";
import { Alert, AlertDescription } from "@/shared/ui";
import "./login.css";
import { getHomePath, getRedirectPath } from "@/shared/auth/auth";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/shared/components/LanguageToggle";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

type LoginSearch = {
    redirect?: string;
};

export const Route = createFileRoute("/(public)/(auth)/login/")({
    head: () => ({
        meta: [
            { title: 'Login | DAPEN' },
            { name: 'description', content: 'Login to access your DAPEN account.' },
        ],
    }),
    validateSearch: (search: Record<string, unknown>): LoginSearch => {
        return {
            redirect: search.redirect as string | undefined,
        };
    },
    beforeLoad: async ({ search }) => {
        const auth = useAuthStore.getState();
        if (auth.user) {
            throw redirect({ to: getRedirectPath(auth.user, search.redirect) });
        }
    },
    component: LoginPage,
});

function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const { toast } = useToast();
    const search = Route.useSearch();
    const user = useAuthStore((state) => state.user);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const [globalError, setGlobalError] = useState<Error | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            navigate({ to: getRedirectPath(user, search.redirect) });
        }
    }, [user, navigate, search.redirect]);

    const form = useForm<ILoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const onSubmit = async (data: ILoginInput) => {
        setGlobalError(null);

        try {
            await login(data.username, data.password);
            const user = useAuthStore.getState().user;
            navigate({ to: getRedirectPath(user, search.redirect) });
        } catch (error) {
            const err = error instanceof Error ? error : new Error(t('auth.login.login_failed'));
            setGlobalError(err);
            toast({
                title: t('auth.login.login_failed'),
                description: err.message,
                variant: 'destructive',
            });
        }
    };

    if (!isInitialized) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                        <div className="w-32 h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                        <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                        <div className="w-full h-12 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mt-6" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
                <LanguageToggle />
                <ThemeToggle />
            </div>
            <div className="login-background relative w-full min-h-screen overflow-hidden flex items-center justify-center p-4">
                <div className="blob-container absolute inset-0 z-0" />

                <div className="login-form-container relative z-10 w-full max-w-sm">
                    <div className="rounded-3xl p-8 sm:p-10 w-full transition-colors duration-300 bg-white dark:bg-slate-900 shadow-2xl">
                        <div className="flex flex-col items-center mb-8">
                            <div className="flex items-center space-x-2 mb-6">
                                <svg
                                    className="w-8 h-8 text-primary-600"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                                <span className="text-2xl font-bold text-gray-800 dark:text-white">{t('auth.login.title')}</span>
                            </div>
                        </div>

                        {globalError && (
                            <Alert className="mb-6 border-red-200 bg-red-50/80 dark:bg-red-900/20">
                                <AlertDescription className="text-red-800 dark:text-red-200 text-sm font-medium">{globalError.message}</AlertDescription>
                            </Alert>
                        )}

                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.login.username')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    placeholder={t('auth.login.username_placeholder')}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all dark:text-white"
                                                    {...field}
                                                    aria-label={t('auth.login.username')}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-500 text-xs mt-1" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.login.password')}</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder={t('auth.login.password_placeholder')}
                                                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all dark:text-white"
                                                        {...field}
                                                        aria-label={t('auth.login.password')}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                        disabled={form.formState.isSubmitting}
                                                        tabIndex={-1}
                                                        title={showPassword ? "Hide password" : "Show password"}>
                                                        {showPassword ? (
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-500 text-xs mt-1" />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full py-6 text-base font-semibold shadow-xl shadow-primary-500/20"
                                    loading={form.formState.isSubmitting}
                                    aria-label={t('auth.login.sign_in')}>
                                    {t('auth.login.sign_in')}
                                </Button>
                            </form>
                        </Form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('auth.login.no_account')}{" "}
                                <a
                                    href="/register"
                                    aria-label={t('auth.login.create_one')}
                                    className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                                    {t('auth.login.create_one')}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

