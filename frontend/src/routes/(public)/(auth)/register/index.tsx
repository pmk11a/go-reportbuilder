import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { registerSchema, type IRegisterInput } from "@/schemas/auth";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/form/input";
import { Button } from "@/components/ui/overlay/button";
import { Alert, AlertDescription } from "@/components/ui";
import { cn } from "@/utils/cn";
import { getHomePath } from "@/utils/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    const isDark = useThemeStore((state) => state.isDark);
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
            setSuccessMessage("Registration is not yet implemented. Please use the login page.");
        } catch (error: any) {
            setGlobalError(error.message || "Registration failed");
        }
    };

    return (
        <div
            className={cn(
                "relative w-full min-h-screen overflow-hidden flex items-center justify-center p-4",
                isDark ? "register-background-dark" : "register-background-light",
            )}>
            <ThemeToggle className="fixed top-6 right-6 z-50" />

            <div className="blob-container absolute inset-0 z-0" />

            <div className="register-form-container relative z-10 w-full max-w-sm">
                <div
                    className={cn(
                        "register-form-box rounded-3xl p-8 sm:p-10 w-full transition-colors duration-300",
                        isDark ? "bg-slate-900/95" : "bg-white/95",
                    )}>
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center space-x-2 mb-6">
                            <svg
                                className="w-8 h-8 text-blue-600"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                            <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>DAPEN</span>
                        </div>
                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Create a new account</p>
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
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4">
                            {/* Name Field */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                            Full Name
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="Enter your name"
                                                disabled={form.formState.isSubmitting}
                                                variant="primary"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Email Field */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                            Email Address
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="you@example.com"
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
                                        <FormLabel className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                            Password
                                        </FormLabel>
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
                                                    className={cn(
                                                        "absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50",
                                                        isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700",
                                                    )}
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

                            {/* Confirm Password Field */}
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                            Confirm Password
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    disabled={form.formState.isSubmitting}
                                                    variant="primary"
                                                    className="pr-10"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className={cn(
                                                        "absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50",
                                                        isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700",
                                                    )}
                                                    disabled={form.formState.isSubmitting}
                                                    tabIndex={-1}>
                                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                                {form.formState.isSubmitting ? "Creating account..." : "Create Account"}
                            </Button>
                        </form>
                    </Form>

                    <p className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-600"} mt-6`}>
                        Already have an account?{" "}
                        <a
                            href="/login"
                            className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
