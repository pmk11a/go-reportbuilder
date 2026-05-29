import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/authStore";
import { loginSchema, type ILoginInput } from "@/schemas/auth";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/form/input";
import { Button } from "@/components/ui/overlay/button";
import { Alert, AlertDescription } from "@/components/ui";
import "./login.css";
import { getHomePath } from "@/utils/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/(public)/(auth)/login/")({
    beforeLoad: async () => {
        const auth = useAuthStore.getState();
        if (auth.user) {
            throw redirect({ to: getHomePath(auth.user) });
        }
    },
    component: LoginPage,
});

export function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

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
            navigate({ to: getHomePath(user) });
        } catch (error) {
            setGlobalError(error instanceof Error ? error.message : "Login failed");
        }
    };

    return (
        <>
            <ThemeToggle className="fixed top-6 right-6 z-50" />
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
                                <span className="text-2xl font-bold text-gray-800 dark:text-white">DAPEN</span>
                            </div>
                        </div>

                        {globalError && (
                            <Alert className="mb-6 border-red-200 bg-red-50/80 dark:bg-red-900/20">
                                <AlertDescription className="text-red-800 dark:text-red-200 text-sm font-medium">{globalError}</AlertDescription>
                            </Alert>
                        )}

                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4">
                                {/* Username Field */}
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field, fieldState: { error } }) => (
                                        <FormItem>
                                            <FormLabel className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    placeholder="yourusername"
                                                    disabled={form.formState.isSubmitting}
                                                    variant="primary"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Password Field */}
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field, fieldState: { error } }) => (
                                        <FormItem>
                                            <FormLabel className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="••••••••"
                                                        disabled={form.formState.isSubmitting}
                                                        variant="primary"
                                                        className="pr-10"
                                                        {...field}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                        disabled={form.formState.isSubmitting}
                                                        tabIndex={-1}>
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full mt-6"
                                    loading={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? "Logging in..." : "Sign In"}
                                </Button>
                            </form>
                        </Form>

                        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-6">
                            Don't have an account?{" "}
                            <a
                                href="/register"
                                className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
                                Create one
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
