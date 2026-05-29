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

