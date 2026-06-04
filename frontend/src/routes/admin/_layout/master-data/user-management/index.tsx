import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DeleteConfirmationDialog,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
} from "@/components/ui";
import { useUsers } from "@/hooks/useUsers";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/data/table";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { Input } from "@/components/ui/form/input";
import { 
  Pencil, 
  Shield, 
  History, 
  Trash, 
  Check, 
  X, 
  Plus, 
  Search, 
  RefreshCw 
} from "lucide-react";
import { UserFormDialog } from "@/components/admin/users/UserFormDialog";
import { UserPermissionsDialog } from "@/components/admin/users/UserPermissionsDialog";
import { Each, Show } from "@/components/ui/layout/Render";
import type { IDbflpass } from "@/types/user";

export const Route = createFileRoute("/admin/_layout/master-data/user-management/")({
  component: UserManagementPage,
});

function UserManagementPage() {
  const { t } = useTranslation(["users", "menu", "common"]);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { useUsersList, useDeleteUser, useUpdateUser } = useUsers();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IDbflpass | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [permissionUser, setPermissionUser] = useState<IDbflpass | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string>("");

  const { page, setPage, limit, renderPagination } = usePagination(10);

  // Reset page when search term or status changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, setPage]);

  // Fetch users list from BFF
  const { data: response, isLoading, isFetching, isError, refetch } = useUsersList(page, limit, debouncedSearch, statusFilter === "all" ? "" : statusFilter);
  const deleteMutation = useDeleteUser();
  const updateMutation = useUpdateUser();

  const handleCreateClick = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const handleEditClick = (user: IDbflpass) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleDeleteClick = (user: IDbflpass) => {
    const uId = user.user_id;
    if (currentUser?.username === uId || currentUser?.user_id === uId) {
      toast({
        title: t("common.error", "Error"),
        description: t("messages.delete_self_error", "You cannot delete your own account"),
        variant: "destructive",
      });
      return;
    }
    setDeleteUserId(uId);
    setDeleteUserName(user.full_name || uId);
  };

  const confirmDelete = () => {
    if (!deleteUserId) return;
    deleteMutation.mutate(deleteUserId, {
      onSuccess: () => {
        setDeleteUserId(null);
        refetch();
      },
    });
  };

  const handleToggleStatus = (user: IDbflpass) => {
    const newStatus = user.status === "1" ? "0" : "1";
    updateMutation.mutate(
      {
        id: user.user_id,
        data: {
          full_name: user.full_name ?? '',
          role: user.tingkat === "2" ? "admin" : "karyawan",
          status: newStatus,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: t("common.success", "Success"),
            description: t("messages.status_updated", "User status updated successfully"),
            variant: "success",
          });
          refetch();
        },
        onError: () => {
          toast({
            title: t("common.error", "Error"),
            description: t("messages.status_update_failed", "Failed to update user status"),
            variant: "destructive",
          });
        },
      }
    );
  };

  // Extract arrays and pagination data from the Go API wrapper structure
  const users = response?.data?.data || [];
  const pagination = response?.data?.pagination || { current_page: 1, last_page: 1, total: 0, per_page: 10 };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden">
        {/* Toolbar Header - Identical to MenuDataTable */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
            {/* Separate Status Select Dropdown */}
            <div className="w-full sm:w-40 flex items-center">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm">
                  <SelectValue placeholder={t("status_filter_all", "All Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_filter_all", "All Status")}</SelectItem>
                  <SelectItem value="1">{t("status_filter_active", "Active")}</SelectItem>
                  <SelectItem value="0">{t("status_filter_inactive", "Inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Joined Search Input and Button Group */}
            <div className="flex w-full sm:w-auto items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t("search_placeholder", "Search user...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPage(1);
                    }
                  }}
                  className="pl-9 h-9 bg-white dark:bg-slate-950 rounded-r-none border-r-0 focus:z-10 focus:ring-secondary-500 text-sm"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-l-none rounded-r-xl h-9 px-6 font-semibold flex items-center justify-center"
                onClick={() => {
                  setPage(1);
                }}
              >
                {t("common.search", "Search")}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              {t("common.refresh", "Refresh")}
            </Button>
            <Button onClick={handleCreateClick} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t("add_user", "Tambah User")}
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.user_id", "USER ID")}</TableHead>
                <TableHead>{t("fields.full_name", "FULL NAME")}</TableHead>
                <TableHead>{t("fields.level", "LEVEL")}</TableHead>
                <TableHead>{t("fields.status", "STATUS")}</TableHead>
                <TableHead className="text-right">{t("fields.actions", "ACTIONS")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Show
                when={isFetching && users.length === 0}
                fallback={
                  <Show
                    when={isError}
                    fallback={
                      <Show
                        when={users.length === 0}
                        fallback={
                          <Each of={users}>
                            {(user: IDbflpass) => (
                              <TableRow key={user.user_id}>
                                {/* USER ID: Medium & Contrast */}
                                <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                  {user.user_id}
                                </TableCell>

                                {/* FULL NAME */}
                                <TableCell>
                                  {user.full_name || "-"}
                                </TableCell>

                                {/* LEVEL: Standard Badge */}
                                <TableCell>
                                  <Badge variant="outline">Lvl {user.tingkat || "0"}</Badge>
                                </TableCell>

                                {/* STATUS: Standard Badge */}
                                <TableCell>
                                  <Badge variant={user.status === "1" ? "success" : "secondary"}>
                                    {user.status === "1" ? t("status_filter_active", "Active") : t("status_filter_inactive", "Inactive")}
                                  </Badge>
                                </TableCell>

                                {/* ACTIONS: Clean aligned ghost buttons matching MenuDataTable */}
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {/* Toggle Status Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-8 w-8 ${user.status === "1" ? "text-amber-500 hover:text-amber-600" : "text-emerald-600 hover:text-emerald-700"}`}
                                      onClick={() => handleToggleStatus(user)}
                                      title={user.status === "1" ? t("buttons.disable", "Disable") : t("buttons.enable", "Enable")}
                                    >
                                      <Show when={user.status === "1"} fallback={<Check className="h-4 w-4" />}>
                                        <X className="h-4 w-4" />
                                      </Show>
                                    </Button>

                                    {/* Permissions Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-slate-500 hover:text-slate-600"
                                      title={t("buttons.permissions", "Permissions")}
                                      onClick={() => {
                                        setPermissionUser(user);
                                        setPermissionsOpen(true);
                                      }}
                                    >
                                      <Shield className="h-4 w-4" />
                                    </Button>

                                    {/* Logs Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-cyan-600 hover:text-cyan-700"
                                      title={t("buttons.logs", "Logs")}
                                    >
                                      <History className="h-4 w-4" />
                                    </Button>

                                    {/* Edit Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                      onClick={() => handleEditClick(user)}
                                      title={t("buttons.edit", "Edit")}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>

                                    {/* Delete Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-600 hover:text-red-700"
                                      onClick={() => handleDeleteClick(user)}
                                      title={t("buttons.delete", "Hapus")}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Each>
                        }
                      >
                        <TableRow>
                          <TableCell colSpan={5} className="px-4 py-8 text-center text-slate-500">
                            {t("messages.empty", "No users found")}
                          </TableCell>
                        </TableRow>
                      </Show>
                    }
                  >
                    <TableRow>
                      <TableCell colSpan={5} className="px-4 py-8 text-center text-red-500 font-medium">
                        {t("messages.error_loading", "Error loading users")}
                      </TableCell>
                    </TableRow>
                  </Show>
                }
              >
                <Each of={Array.from({ length: limit })}>
                  {(_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Each>
              </Show>
            </TableBody>
          </Table>
        </div>

        {/* Pagination aligned perfectly with Menu Management styling */}
        {renderPagination({
          totalPages: pagination.last_page,
          totalItems: pagination.total,
          className: "border-t-0",
        })}
      </div>

      {/* User Form Dialog */}
      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={selectedUser} />

      {/* User Permissions Dialog */}
      <UserPermissionsDialog open={permissionsOpen} onOpenChange={setPermissionsOpen} user={permissionUser} />

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        onConfirm={confirmDelete}
        itemName={deleteUserName}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
