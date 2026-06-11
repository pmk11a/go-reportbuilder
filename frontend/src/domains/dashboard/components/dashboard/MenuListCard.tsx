import React, { useEffect, useMemo, useState, memo } from "react";
import { useNavigate } from "@tanstack/react-router";
import DynamicLucideIcon from "@/shared/ui/LucideIcon";
import { useMenuStore, MenuItemType } from "@/domains/menu/stores/menuStore";
import { Search, Grid, X, ArrowLeft, Loader2 } from "lucide-react";
import { useThemeStore } from "@/shared/stores/themeStore";
import { useModalStore } from "@/shared/stores/modalStore";
import { useTranslation } from "react-i18next";

// Memoized MenuItem component matching both light and dark mode styles
interface MenuItemProps {
    item: MenuItemType;
    onClick: () => void;
    isChild?: boolean;
    isActive?: boolean;
    isDark: boolean;
    isMenuExpanded: boolean;
}

const MenuItem = memo(({ item, onClick, isChild = false, isActive = false, isDark, isMenuExpanded }: MenuItemProps) => {
    const hasChildren = Boolean(item.items?.length);
    const hasRoute = Boolean(item.route && item.route.trim() !== "#" && item.route.trim() !== "");
    const [isHovered, setIsHovered] = useState(false);

    const widthClass = isHovered ? "w-auto min-w-[90px] md:min-w-[100px]" : isMenuExpanded ? "w-24 md:w-28" : "w-20 md:w-24 shrink-0";
    const cursorClass = hasRoute || hasChildren ? "cursor-pointer hover:scale-105" : "cursor-default opacity-70";

    const iconBgClass = isActive
        ? isDark
            ? "bg-sky-500 text-white"
            : "bg-sky-600 text-white"
        : isHovered
          ? "bg-sky-500 text-white"
          : isChild
            ? hasRoute
                ? isDark
                    ? "bg-white/10 text-sky-400"
                    : "bg-sky-50 text-sky-700"
                : isDark
                  ? "bg-white/5 text-slate-600 opacity-60"
                  : "bg-slate-100 text-slate-400 opacity-60"
            : hasRoute
              ? isDark
                  ? "bg-white/10 text-sky-400"
                  : "bg-sky-50 text-sky-700"
              : hasChildren
                ? isDark
                    ? "bg-white/10 text-sky-400"
                    : "bg-sky-50 text-sky-700"
                : isDark
                  ? "bg-white/5 text-slate-600 opacity-60"
                  : "bg-slate-100 text-slate-400 opacity-60";

    const textClass = hasRoute
        ? isDark
            ? "text-sky-400"
            : "text-sky-600 font-bold"
        : hasChildren
          ? isDark
              ? "text-slate-300"
              : "text-slate-700 font-semibold"
          : isDark
            ? "text-slate-600 opacity-60"
            : "text-slate-400 opacity-60";

    const textOverflowClass = isHovered ? "whitespace-nowrap overflow-visible" : "line-clamp-2 overflow-hidden break-words";

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative flex flex-col items-center justify-start text-center p-2 md:p-3 rounded-2xl 
                  ${widthClass} h-auto min-h-[5rem] md:min-h-[6rem] transition-all duration-200 ${
                      isDark ? "hover:bg-white/5" : "hover:bg-sky-50"
                  } ${cursorClass} group z-10`}>
            {hasChildren && !isChild && (
                <div className="absolute -top-1 -right-1 bg-sky-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f172a] shadow-lg">
                    {item.items!.length}
                </div>
            )}

            <div className={`p-2.5 md:p-3 rounded-full transition-all duration-300 ${iconBgClass}`}>
                <DynamicLucideIcon
                    name={item.icon || "Box"}
                    size={18}
                    className="md:w-5 md:h-5"
                />
            </div>
            <span className={`text-[10px] md:text-xs mt-1 md:mt-2 w-full px-0.5 transition-all duration-200 ${textOverflowClass} ${textClass}`}>
                {item.title}
            </span>
        </button>
    );
});

MenuItem.displayName = "MenuItem";

const MenuListCard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isDark = useThemeStore((state) => state.isDark);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const [isMenuExpanded, setIsMenuExpanded] = useState<boolean>(false);
    const [searchFilter, setSearchFilter] = useState<string>("");
    const { openModal } = useModalStore();

    const { menus: menuItems, isLoading, error, fetchMenus } = useMenuStore();

    useEffect(() => {
        fetchMenus();
    }, [fetchMenus]);

    const parentMenus = useMemo(() => {
        if (!Array.isArray(menuItems)) return [];
        return menuItems.filter((menu) => (menu.type === "group" && menu.items && menu.items.length > 0) || menu.type === "item");
    }, [menuItems]);

    const getFilteredItems = (): { simple: MenuItemType[]; parentGroups: Map<MenuItemType, MenuItemType[]> } => {
        const term = searchFilter.toLowerCase();

        if (!Array.isArray(menuItems)) {
            return { simple: [], parentGroups: new Map() };
        }

        if (term === "") {
            return { simple: [], parentGroups: new Map() };
        }

        const simple: MenuItemType[] = [];
        const parentGroups = new Map<MenuItemType, MenuItemType[]>();

        menuItems.forEach((group) => {
            if (group.type === "group" && group.items) {
                group.items.forEach((item) => {
                    if (item.items) {
                        const parentMatch = item.title.toLowerCase().includes(term);
                        const matchingChildren = item.items.filter((child) => child.title.toLowerCase().includes(term));

                        if (parentMatch || matchingChildren.length > 0) {
                            parentGroups.set(item, matchingChildren.length > 0 ? matchingChildren : item.items);
                        }
                    } else {
                        if (item.title.toLowerCase().includes(term)) {
                            simple.push(item);
                        }
                    }
                });
            }
        });

        return { simple, parentGroups };
    };

    const searchResults = useMemo(getFilteredItems, [searchFilter, menuItems]);

    const handleItemClick = (item: MenuItemType) => {
        const route = item.route?.trim();
        const hasRoute = Boolean(route && route !== "#" && route !== "");
        
        if (route && route.startsWith("#") && route.length > 1) {
            const modalName = route.substring(1);
            openModal(modalName);
        } else if (hasRoute) {
            navigate({ to: item.route as any });
        } else if (item.items && item.items.length > 0) {
            setActiveSubmenu(item.code || item.title || null);
        }
    };

    if (isLoading) {
        return (
            <div
                className={`relative rounded-[24px] border p-8 flex items-center justify-center transition-all duration-500 ${
                    isDark ? "bg-[#0f172a] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-blue-500/5"
                }`}>
                <Loader2
                    className="animate-spin text-sky-500"
                    size={32}
                />
            </div>
        );
    }

    if (error) {
        return (
            <div
                className={`relative rounded-[24px] border p-6 transition-all duration-500 ${
                    isDark ? "bg-[#0f172a] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl"
                }`}>
                <p className="text-red-500 text-center font-semibold">{error}</p>
            </div>
        );
    }

    return (
        <div
            className={`relative rounded-[24px] border p-4 flex flex-col gap-3 transition-all duration-500 ${
                isDark ? "bg-[#0f172a] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-blue-500/5"
            }`}>
            {/* Expanded Search State */}
            {isMenuExpanded && !activeSubmenu && (
                <>
                    <div className="flex justify-between items-center">
                        <h2 className={`text-xl font-black ${isDark ? "text-white" : "text-[#1e3a8a]"}`}>{t("menu_list.menu")}</h2>
                        <button
                            onClick={() => {
                                setIsMenuExpanded(false);
                                setSearchFilter("");
                            }}
                            className={`p-2 rounded-xl transition-colors ${
                                isDark ? "hover:bg-white/10 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-sky-600"
                            }`}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder={t("menu_list.search_menu")}
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className={`w-full py-2.5 px-4 pl-11 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold transition-all border ${
                                isDark
                                    ? "bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                            }`}
                        />
                        <Search
                            size={18}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        />
                    </div>

                    <hr className={isDark ? "border-white/5" : "border-slate-100"} />

                    {searchFilter.length > 0 ? (
                        <div className="flex flex-wrap gap-4 max-h-60 overflow-y-auto pr-2">
                            {searchResults.simple.map((item) => (
                                <MenuItem
                                    key={item.code || item.title}
                                    item={item}
                                    isDark={isDark}
                                    isMenuExpanded={isMenuExpanded}
                                    onClick={() => handleItemClick(item)}
                                />
                            ))}

                            {Array.from(searchResults.parentGroups.entries()).map(([parent, children]) => (
                                <React.Fragment key={parent.code || parent.title}>
                                    <MenuItem
                                        item={parent}
                                        isDark={isDark}
                                        isMenuExpanded={isMenuExpanded}
                                        onClick={() => handleItemClick(parent)}
                                    />
                                    <div className={`w-[1px] h-12 align-middle self-center ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                                    {children.map((child) => (
                                        <MenuItem
                                            key={child.code || child.title}
                                            item={child}
                                            isChild
                                            isDark={isDark}
                                            isMenuExpanded={isMenuExpanded}
                                            onClick={() => handleItemClick(child)}
                                        />
                                    ))}
                                    <div className={`w-[1px] h-12 align-middle self-center ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4 max-h-60 overflow-y-auto pr-2">
                            {parentMenus.length > 0 ? (
                                parentMenus.map((group, index) => (
                                    <MenuItem
                                        key={group.code || group.title || `group-${index}`}
                                        item={group}
                                        isDark={isDark}
                                        isMenuExpanded={isMenuExpanded}
                                        onClick={() => handleItemClick(group)}
                                    />
                                ))
                            ) : (
                                <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t("menu_list.no_menu")}</p>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Standard Collapsed Horizontal State */}
            {!isMenuExpanded && !activeSubmenu && (
                <div className="flex flex-row items-center gap-2 w-full">
                    <div className="flex flex-col items-center justify-center px-2 shrink-0">
                        <button
                            onClick={() => setIsMenuExpanded(true)}
                            className={`p-3 rounded-xl transition-colors ${
                                isDark ? "hover:bg-white/5 text-slate-400 hover:text-sky-400" : "hover:bg-sky-50 text-slate-500 hover:text-sky-600"
                            }`}
                            title={t("menu_list.expand_menu")}>
                            <Grid size={24} />
                        </button>
                        <span className={`text-[12px] font-black uppercase mt-0.5 tracking-wider ${isDark ? "text-sky-400" : "text-[#1e3a8a]"}`}>
                            {t("menu_list.menu")}
                        </span>
                    </div>

                    <div className={`w-[1px] h-12 mx-2 shrink-0 ${isDark ? "bg-white/10" : "bg-slate-100"}`} />

                    <div className="flex-1 overflow-x-auto scrollbar-hide py-1">
                        <div className="flex gap-2 min-w-max items-center">
                            {parentMenus.length > 0 ? (
                                parentMenus.map((group, index) => (
                                    <MenuItem
                                        key={group.code || group.title || `group-${index}`}
                                        item={group}
                                        isDark={isDark}
                                        isMenuExpanded={isMenuExpanded}
                                        onClick={() => handleItemClick(group)}
                                    />
                                ))
                            ) : (
                                <p className={`text-sm shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t("menu_list.no_menu")}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Submenu Display State */}
            {activeSubmenu && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center">
                        <button
                            onClick={() => setActiveSubmenu(null)}
                            className={`p-2 rounded-full transition-colors mr-2 ${
                                isDark ? "hover:bg-white/10 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-600 hover:text-sky-600"
                            }`}>
                            <ArrowLeft size={20} />
                        </button>
                        <h3 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-800"}`}>
                            {menuItems.find((g) => (g.code || g.title) === activeSubmenu)?.title}
                        </h3>
                    </div>
                    <div className="flex-1 overflow-x-auto scrollbar-hide py-1">
                        <div className="flex gap-2 min-w-max items-center">
                            {menuItems
                                .find((g) => (g.code || g.title) === activeSubmenu)
                                ?.items?.map((item) => (
                                    <MenuItem
                                        key={item.code || item.title}
                                        item={item}
                                        isChild
                                        isDark={isDark}
                                        isMenuExpanded={isMenuExpanded}
                                        onClick={() => handleItemClick(item)}
                                    />
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuListCard;
