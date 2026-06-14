import { useEffect, useRef } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { Wifi, WifiOff } from "lucide-react";

export function NetworkStatus() {
    const { toast } = useToast();
    const hasCheckedInitialRef = useRef(false);

    useEffect(() => {
        // Check initial state
        if (!navigator.onLine && !hasCheckedInitialRef.current) {
            toast({
                title: (
                    <div className="flex items-center space-x-2">
                        <WifiOff className="w-5 h-5" />
                        <span className="font-semibold">Connection Lost</span>
                    </div>
                ),
                description: "You are currently offline. Requests have been paused.",
                variant: "destructive",
            });
            hasCheckedInitialRef.current = true;
        }

        function handleOnline() {
            toast({
                title: (
                    <div className="flex items-center space-x-2">
                        <Wifi className="w-5 h-5" />
                        <span className="font-semibold">Network Restored</span>
                    </div>
                ),
                description: "You're back online! Everything is working normally.",
                variant: "success",
            });
        }

        function handleOffline() {
            toast({
                title: (
                    <div className="flex items-center space-x-2">
                        <WifiOff className="w-5 h-5" />
                        <span className="font-semibold">Connection Lost</span>
                    </div>
                ),
                description: "You are currently offline. Requests have been paused.",
                variant: "destructive",
            });
        }

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [toast]);

    return null;
}
