import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IDbMenu } from '@/types/menu';;
import { useMenus, useDeleteMenu, menuKeys } from "@/hooks/useMenu";
import { Button } from "@/components/ui/overlay/button";
import { Input } from "@/components/ui/form/input";
import { MenuFormDialog } from "./MenuFormDialog";
import { Plus, Edit, Trash2, Search, RefreshCw } from "lucide-react";
import DynamicLucideIcon from "@/components/ui/LucideIcon";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/data/table";
import { Badge } from "@/components/ui";

export function MenuDataTable() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const { page, setPage, limit, renderPagination } = usePagination(10);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<IDbMenu | null>(null);

    // Reset page when search query changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, setPage]);

    const { data: response, isLoading, isFetching } = useMenus(page, limit, debouncedSearch);
    const deleteMutation = useDeleteMenu();

    const handleDelete = (kode: string) => {
        if (confirm(`Yakin ingin menghapus menu ${kode}?`)) {
            deleteMutation.mutate(kode);
        }
    };

    const handleEdit = (menu: IDbMenu) => {
        setSelectedMenu(menu);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setSelectedMenu(null);
        setIsFormOpen(true);
    };

    const menus = response?.data?.data || [];
    const pagination = response?.data?.pagination || { current_page: 1, last_page: 1, total: 0, per_page: 10 };

    return (
        <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari kode atau nama menu..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setPage(1);
                                }
                            }}
                            className="pl-9 bg-white dark:bg-slate-950 rounded-r-none border-r-0 focus:z-10 focus:ring-secondary-500"
                        />
                    </div>
                    <Button
                        variant="secondary"
                        className="rounded-l-none rounded-r-xl h-auto px-6 font-semibold"
                        onClick={() => {
                            setPage(1);
                        }}>
                        Cari
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => queryClient.invalidateQueries({ queryKey: menuKeys.all })}
                        disabled={isFetching}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleAdd}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Menu
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kode Menu</TableHead>
                            <TableHead>Level (L0)</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead>Ikon</TableHead>
                            <TableHead>Rute</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isFetching ? (
                            Array.from({ length: limit }).map((_, index) => (
                                <TableRow key={`skeleton-${index}`}>
                                    <TableCell>
                                        <Skeleton className="h-5 w-16" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-12" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-32" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-4" />
                                            <Skeleton className="h-5 w-24" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-24" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : menus.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-slate-500">
                                    Tidak ada data menu yang ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            menus.map((menu: IDbMenu) => (
                                <TableRow key={menu.KODEMENU}>
                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{menu.KODEMENU}</TableCell>
                                    <TableCell>
                                        <Badge>Lvl {menu.L0}</Badge>
                                    </TableCell>
                                    <TableCell>{menu.Keterangan}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            {menu.Icon ? (
                                                <>
                                                    <DynamicLucideIcon
                                                        name={menu.Icon}
                                                        className="h-4 w-4"
                                                    />
                                                    <span className="text-xs">{menu.Icon}</span>
                                                </>
                                            ) : (
                                                <span className="text-xs italic text-slate-400">-</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{menu.Routename || "-"}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                                onClick={() => handleEdit(menu)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                                onClick={() => handleDelete(menu.KODEMENU)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {renderPagination({
                totalPages: pagination.last_page,
                totalItems: pagination.total,
                className: "border-t-0",
            })}

            {isFormOpen && (
                <MenuFormDialog
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    initialData={selectedMenu}
                />
            )}
        </div>
    );
}
