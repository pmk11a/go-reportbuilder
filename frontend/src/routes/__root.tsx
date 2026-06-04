import { useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useAuthStore } from "@/store/authStore";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/feedback/toaster";
import { NetworkStatus } from "@/components/NetworkStatus";
import { NotFoundComponent, GlobalErrorComponent } from "@/components/ui/feedback/error-pages";
import "@/styles/globals.css";

interface RouterContext {
    auth: ReturnType<typeof useAuthStore.getState>;
}

export const Route = createRootRoute({
    context: () => ({
        auth: useAuthStore.getState(),
    }),
    beforeLoad: async () => {
        // Initialize CSRF protection FIRST (needed for all API calls)
        if (typeof window !== 'undefined') {
            const { initCsrfProtection } = await import('@/lib/api')
            await initCsrfProtection()
        }

        // Initialize auth BEFORE any route is loaded
        const auth = useAuthStore.getState();
        if (!auth.isInitialized) {
            await auth.initializeAuth();
        }
    },
    component: RootLayout,
    notFoundComponent: () => <NotFoundComponent />,
    errorComponent: ({ error }) => <GlobalErrorComponent error={error as Error} />,
});

function RootLayout() {
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'auth-storage') {
                try {
                    const newValue = event.newValue;
                    if (newValue) {
                        const parsed = JSON.parse(newValue);
                        if (parsed && parsed.state) {
                            const user = parsed.state.user;
                            useAuthStore.getState().setUser(user);
                        }
                    } else {
                        useAuthStore.getState().setUser(null);
                    }
                } catch (e) {
                    console.error("Failed to parse auth-storage change:", e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <Outlet />
                <Toaster />
                <NetworkStatus />
            </div>
        </ThemeProvider>
    );
}

