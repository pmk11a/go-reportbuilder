import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/domains/users/services/userService'
import type {
  ICreateUserPayload,
  IUpdateUserPayload,
  IUserPermission,
  IUserCoaAccess,
} from '@/domains/users/types/user'
import { useToast } from '@/shared/hooks/use-toast'
import { formatAPIError } from '@/shared/utils/errorMapper'

/**
 * Shared cache settings for the per-tab permission queries.
 * 10 min staleTime + 15 min gcTime means switching between groups in the
 * UserPermissionsTab never re-fetches as long as the user opened the
 * tab within the staleness window.
 */
export const USER_PERMISSION_STALE_TIME = 10 * 60 * 1000 // 10 minutes
export const USER_PERMISSION_GC_TIME = 15 * 60 * 1000 // 15 minutes

/**
 * TanStack Query options accepted by the per-tab permission hooks. We expose
 * just `enabled` because the dialog needs to lazy-load each tab on first
 * activation — all other knobs (staleTime, gcTime, queryKey) are owned by the
 * hook to keep the cache shape consistent.
 */
export interface IUserPermissionQueryOptions {
  enabled?: boolean
}

export const useUsers = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const useUsersList = (page: number, limit: number, search: string, status: string) =>
    useQuery({
      queryKey: ['users', { page, limit, search, status }],
      queryFn: async () => {
        const response = await userService.list({ page, limit, search, status })
        return response
      },
    })

  const useCreateUser = () =>
    useMutation({
      mutationFn: async (data: ICreateUserPayload) => {
        const response = await userService.create(data)
        return response.data
      },
      onSuccess: () => {
        toast({ title: 'Success', description: 'User created successfully', variant: 'success' })
        queryClient.invalidateQueries({ queryKey: ['users'] })
      },
      onError: (error: any) => {
        const errorMsg = error.response
          ? formatAPIError(error.response.status, error.message)
          : error.message
        toast({ title: 'Error', description: errorMsg || 'Failed to create user', variant: 'destructive' })
      },
    })

  const useUpdateUser = () =>
    useMutation({
      mutationFn: async ({ id, data }: { id: string | number; data: IUpdateUserPayload }) => {
        const response = await userService.update(id, data)
        return response.data
      },
      onSuccess: (_data, variables) => {
        toast({ title: 'Success', description: 'User updated successfully', variant: 'success' })
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['user', String(variables.id)] })
      },
      onError: (error: any) => {
        const errorMsg = error.response
          ? formatAPIError(error.response.status, error.message)
          : error.message
        toast({ title: 'Error', description: errorMsg || 'Failed to update user', variant: 'destructive' })
      },
    })

  const useDeleteUser = () =>
    useMutation({
      mutationFn: async (id: string | number) => {
        await userService.delete(id)
      },
      onSuccess: () => {
        toast({ title: 'Success', description: 'User deleted successfully', variant: 'success' })
        queryClient.invalidateQueries({ queryKey: ['users'] })
      },
      onError: (error: any) => {
        const errorMsg = error.response
          ? formatAPIError(error.response.status, error.message)
          : error.message
        toast({ title: 'Error', description: errorMsg || 'Failed to delete user', variant: 'destructive' })
      },
    })

  /**
   * Single-user fetch (used by UserFormPage in edit mode + UserDetailPage).
   * Cache key: ['user', eid] — separate from list cache so detail invalidation
   * does not refetch the whole table.
   */
  const useUser = (eid: string, options: { enabled?: boolean } = {}) =>
    useQuery({
      queryKey: ['user', eid],
      queryFn: async () => {
        const res = await userService.getById(eid)
        return res.data
      },
      enabled: !!eid && (options.enabled ?? true),
      staleTime: 30 * 1000,
    })

  /**
   * Per-tab hook: fetch ONLY the menu permission rows for a user.
   * Cache key: ['user-permissions', id, 'menu']
   */
  const useUserMenuPermissions = (
    id: string | number,
    options: IUserPermissionQueryOptions = {}
  ) =>
    useQuery({
      queryKey: ['user-permissions', id, 'menu'],
      queryFn: async () => {
        const response = await userService.getUserMenuPermissions(id)
        return response.data
      },
      enabled: !!id && (options.enabled ?? true),
      staleTime: USER_PERMISSION_STALE_TIME,
      gcTime: USER_PERMISSION_GC_TIME,
    })

  /**
   * Per-tab hook: fetch ONLY the report permission rows for a user.
   * Cache key: ['user-permissions', id, 'report']
   */
  const useUserReportPermissions = (
    id: string | number,
    options: IUserPermissionQueryOptions = {}
  ) =>
    useQuery({
      queryKey: ['user-permissions', id, 'report'],
      queryFn: async () => {
        const response = await userService.getUserReportPermissions(id)
        return response.data
      },
      enabled: !!id && (options.enabled ?? true),
      staleTime: USER_PERMISSION_STALE_TIME,
      gcTime: USER_PERMISSION_GC_TIME,
    })

  /**
   * Per-tab hook: fetch ONLY the COA access rows for a user.
   * Cache key: ['user-permissions', id, 'coa']
   */
  const useUserCoaAccess = (
    id: string | number,
    options: IUserPermissionQueryOptions = {}
  ) =>
    useQuery({
      queryKey: ['user-permissions', id, 'coa'],
      queryFn: async () => {
        const response = await userService.getUserCoaAccess(id)
        return response.data
      },
      enabled: !!id && (options.enabled ?? true),
      staleTime: USER_PERMISSION_STALE_TIME,
      gcTime: USER_PERMISSION_GC_TIME,
    })

  /**
   * Mutation: update all 3 permission categories in one transaction.
   * On success, invalidates ALL 3 per-tab caches for the affected user so
   * that subsequent reads return fresh server data.
   */
  const useUpdateUserPermissions = () =>
    useMutation({
      mutationFn: async ({
        id,
        data,
      }: {
        id: string | number
        data: { menu: IUserPermission[]; report: IUserPermission[]; coa: IUserCoaAccess[] }
      }) => {
        const response = await userService.updatePermissions(id, data)
        return response.data
      },
      onSuccess: (_, variables) => {
        toast({
          title: 'Success',
          description: 'User permissions updated successfully',
          variant: 'success',
        })
        queryClient.invalidateQueries({ queryKey: ['user-permissions', variables.id, 'menu'] })
        queryClient.invalidateQueries({ queryKey: ['user-permissions', variables.id, 'report'] })
        queryClient.invalidateQueries({ queryKey: ['user-permissions', variables.id, 'coa'] })
      },
      onError: (error: any) => {
        const errorMsg = error.response
          ? formatAPIError(error.response.status, error.message)
          : error.message
        toast({
          title: 'Error',
          description: errorMsg || 'Failed to update user permissions',
          variant: 'destructive',
        })
      },
    })

  return {
    useUsersList,
    useUserById,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
    useUserMenuPermissions,
    useUserReportPermissions,
    useUserCoaAccess,
    useUpdateUserPermissions,
  }
}
