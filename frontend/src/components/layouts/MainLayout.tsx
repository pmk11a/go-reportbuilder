import React, { useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import { AppBackground } from "@/components/layouts/AppBackground";
import { MainHeader } from "./MainHeader";
import MenuListCard from "@/components/dashboard/MenuListCard";
import { useMenuStore } from "@/store/menuStore";

export function MainLayout() {
    const { fetchMenus, initialized } = useMenuStore();

    useEffect(() => {
        if (!initialized) {
            fetchMenus();
        }
    }, [initialized, fetchMenus]);

    return (
        <AppBackground className="relative h-screen w-screen overflow-hidden flex flex-col font-sans">
            <div className="w-full h-full flex flex-col px-6 py-6 md:px-12 md:py-10 animate-in fade-in duration-700 overflow-y-auto custom-scrollbar">
                {/* Fixed Top Section (Header + Menu) */}
                <div className="w-full flex-none space-y-8 pb-4">
                    <MainHeader />
                    <MenuListCard />
                </div>

                {/* Scrollable Content Area */}
                <main className="flex-1 w-full relative">
                    <Outlet />
                </main>
            </div>
        </AppBackground>
    );
}
