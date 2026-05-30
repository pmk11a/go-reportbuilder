import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { registerSchema, type IRegisterInput } from "@/schemas/auth";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/form/input";
import { Button } from "@/components/ui/overlay/button";
import { Alert, AlertDescription } from "@/components/ui";
import { cn } from "@/utils/cn";
import { getHomePath } from "@/utils/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";
import "./register.css";

export const Route = createFileRoute("/(public)/(auth)/register/")({
    beforeLoad: async () => {
        const auth = useAuthStore.getState();
        if (auth.user) {
            throw redirect({ to: getHomePath(auth.user) });
        }
    },
    component: RegisterPage,
});

function RegisterPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const isDark = useThemeStore((state) => state.isDark);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<IRegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: IRegisterInput) => {
        setGlobalError(null);
        setSuccessMessage(null);

        try {
            setSuccessMessage(t('auth.register.not_implemented'));
        } catch (error: any) {
            const errorMsg = error.message || t('auth.register.register_failed');
            setGlobalError(errorMsg);
            toast({
                title: t('auth.register.register_failed'),
                description: errorMsg,
                variant: 'destructive'
            });
        }
    };

    if (!isInitialized) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
                <Helmet>
                    <title>{t('auth.register.title')} | DAPEN</title>
                    <meta name="description" content="Register a new DAPEN account." />
                </Helmet>
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                        <div className="w-32 h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
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
            <Helmet>
                <title>{t('auth.register.title')} | DAPEN</title>
            </Helmet>
            <div
                className={cn(
                    "relative w-full min-h-screen overflow-hidden flex items-center justify-center p-4",
                    isDark ? "register-background-dark" : "register-background-light",
                )}>
                <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
                    <LanguageToggle />
                    <ThemeToggle />
                </div>

                <div className="blob-container absolute inset-0 z-0" />

                <div className="register-form-container relative z-10 w-full max-w-sm">
                    <div
                        className={cn(
                            "register-form-box rounded-3xl p-8 sm:p-10 w-full transition-colors duration-300",
                            isDark ? "bg-slate-900/95" : "bg-white/95",
                        )}>
                        <div className="flex flex-col items-center mb-8">
                            <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>{t('auth.register.title')}</span>
                        </div>

                        {globalError && (
                            <Alert className="mb-6 border-red-200 bg-red-50/80 dark:bg-red-900/20">
                                <AlertDescription className="text-red-800 dark:text-red-200 text-sm font-medium">{globalError}</AlertDescription>
                            </Alert>
                        )}

                        {successMessage && (
                            <Alert className="mb-6 border-yellow-200 bg-yellow-50/80 dark:bg-yellow-900/20">
                                <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">{successMessage}</AlertDescription>
                            </Alert>
                        )}

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                {t('auth.register.full_name')}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    placeholder={t('auth.register.name_placeholder')}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all dark:text-white"
                                                    {...field}
                                                    aria-label={t('auth.register.full_name')}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-500 text-xs mt-1" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                {t('auth.register.email')}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder={t('auth.register.email_placeholder')}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all dark:text-white"
                                                    {...field}
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
                                            <FormLabel className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                {t('auth.register.password')}
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder={t('auth.register.password_placeholder')}
                                                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all dark:text-white"
                                                        {...field}
                                                        aria-label={t('auth.register.password')}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                        disabled={form.formState.isSubmitting}
                                                        tabIndex={-1}
                                                        title={showPassword ? "Hide password" : "Show password"}
                                                    >
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-500 text-xs mt-1" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                {t('auth.register.confirm_password')}
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder={t('auth.register.password_placeholder')}
                                                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all dark:text-white"
                                                        {...field}
                                                        aria-label={t('auth.register.confirm_password')}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                        disabled={form.formState.isSubmitting}
                                                        tabIndex={-1}
                                                        title={showConfirmPassword ? "Hide password" : "Show password"}
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                                    aria-label={t('auth.register.create_account')}
                                >
                                    {t('auth.register.create_account')}
                                </Button>
                            </form>
                        </Form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('auth.register.has_account')}{" "}
                                <a href="/login" aria-label={t('auth.register.sign_in')} className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                                    {t('auth.register.sign_in')}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RegisterPage;
