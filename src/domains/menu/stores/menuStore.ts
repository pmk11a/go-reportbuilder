import { create } from "zustand";
import { getSidebarMenuFn } from '@/server/functions/menus/sidebar'

export interface MenuItemType {
    type: "item" | "group";
    title: string;
    code?: string;
    icon: string;
    route?: string;
    items?: MenuItemType[];
}

interface MenuStore {
    menus: MenuItemType[];
    isLoading: boolean;
    initialized: boolean;
    error: string | null;
    fetchMenus: () => Promise<void>;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
    menus: [],
    isLoading: false,
    initialized: false,
    error: null,

    fetchMenus: async () => {
        if (get().initialized || get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
            const result = await getSidebarMenuFn()
            if (result?.menu_items) {
                set({ menus: result.menu_items, initialized: true });
            } else {
                set({ error: 'Failed to load menu list' });
            }
        } catch (err: any) {
            set({ error: err.message || 'Failed to fetch menu list' });
        } finally {
            set({ isLoading: false });
        }
    },
}));
