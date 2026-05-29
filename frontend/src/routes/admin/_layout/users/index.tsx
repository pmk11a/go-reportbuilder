import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Button,
    Card,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    LoadingState,
    EmptyState,
    Input,
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui";
import { userService } from "@/services/userService";
import { toast } from "@/hooks/use-toast";
import { Users, Trash2, Edit2 } from "lucide-react";

export const Route = createFileRoute("/admin/_layout/users/")({
    component: UsersPage,
});

function UsersPage() {
    const [search, setSearch] = useState("");
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["users", { search }],
        queryFn: () => userService.list({ page: 1, limit: 50, search }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => userService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast({ title: "IUser deleted successfully" });
            setDeleteUserId(null);
        },
        onError: () => {
            toast({ title: "Failed to delete user", description: "Please try again." });
        },
    });

    const users = data?.data || [];

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-2">Manage system users and permissions</p>
                </div>
                <Button>Add IUser</Button>
            </div>

            <Card className="p-4">
                <Input
                    placeholder="Search users by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </Card>

            <Card>
                {isLoading ? (
                    <LoadingState isLoading={true} />
                ) : error ? (
                    <EmptyState
                        icon={<Users className="h-10 w-10 text-muted-foreground" />}
                        title="Error loading users"
                        description="An error occurred while loading users. Please try again."
                    />
                ) : users.length === 0 ? (
                    <EmptyState
                        icon={<Users className="h-10 w-10 text-muted-foreground" />}
                        title="No users found"
                        description={search ? "No matching users found" : "Create your first user to get started"}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user: any) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {user.role}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${user.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}`}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2">
                                                    <Edit2 className="h-4 w-4" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setDeleteUserId(user.id)}
                                                    className="gap-2">
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            <AlertDialog
                open={!!deleteUserId}
                onOpenChange={(open) => !open && setDeleteUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete IUser</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete this user? This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-4 justify-end">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
                            disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
