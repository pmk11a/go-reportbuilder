import { useEffect } from "react"
import { createRootRoute, Outlet, HeadContent, Scripts } from "@tanstack/react-router"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/shared/theme/ThemeProvider"
import { useAuthStore } from "@/shared/stores/authStore"
import { useThemeStore } from "@/shared/stores/themeStore"
import { Navbar } from "@/shared/components/Navbar"
import { Toaster } from "@/shared/ui/feedback/toaster"
import { NetworkStatus } from "@/shared/components/NetworkStatus"
import { NotFoundComponent, GlobalErrorComponent } from "@/shared/ui/feedback/error-pages"
import { queryClient } from "@/shared/api/query-client"
import { installFetchInterceptor } from "@/shared/api/fetchInterceptor"
import "@/shared/i18n/i18n"
import "@/styles/globals.css"
import "nprogress/nprogress.css"

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
            { title: 'DAPEN - Data Peserta' },
        ],
        links: [
            { rel: 'icon', href: '/favicon.ico' },
        ],
    }),
    beforeLoad: async () => {},
    component: RootLayout,
    notFoundComponent: () => <NotFoundComponent />,
    errorComponent: ({ error }) => <GlobalErrorComponent error={error as Error} />,
})

function RootLayout() {
    useEffect(() => {
        installFetchInterceptor()
        // Rehydrate semua Zustand store dari localStorage (skipHydration: true)
        useThemeStore.persist.rehydrate()
        useThemeStore.getState().initTheme()
        useAuthStore.persist.rehydrate()
        const auth = useAuthStore.getState()
        if (!auth.isInitialized) {
            auth.initializeAuth()
        }
    }, [])

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'auth-storage') {
                try {
                    const newValue = event.newValue
                    if (newValue) {
                        const parsed = JSON.parse(newValue)
                        if (parsed && parsed.state) {
                            const user = parsed.state.user
                            useAuthStore.getState().setUser(user)
                        }
                    } else {
                        useAuthStore.getState().setUser(null)
                    }
                } catch (e) {
                    console.error("Failed to parse auth-storage change:", e)
                }
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body suppressHydrationWarning>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider>
                        <div className="min-h-screen bg-background text-foreground">
                            <Navbar />
                            <Outlet />
                            <Toaster />
                            <NetworkStatus />
                        </div>
                    </ThemeProvider>
                </QueryClientProvider>
                <Scripts />
            </body>
        </html>
    )
}
