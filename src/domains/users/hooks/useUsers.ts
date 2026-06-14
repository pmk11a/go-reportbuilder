import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/domains/users/services/userService'
import type {
  ICreateUserPayload,
  IUpdateUserPayload,
  IUserPermission,
  IUserCoaAccess,
} from '@/domains/users/types'
import { useToast } from '@/shared/hooks/use-toast'
import { formatAPIError } from '@/shared/utils/errorMapper'

export const USER_PERMISSION_STALE_TIME = 10 * 60 * 1000 // 10 minutes
export const USER_PERMISSION_GC_TIME = 15 * 60 * 1000 // 15 minutes

export interface IUserPermissionQueryOptions {
  enabled?: boolean
}

const queryClient_ = () => {
  const queryClient = useQueryClient()
  return queryClient
}

export const useUsersList = (page: number, limit: number, search: string, status: string) => {
  return useQuery({
    queryKey: ['users', { page, limit, search, status }],
    queryFn: async () => {
      const response = await userService.list({ page, limit, search, status })
      return response
    },
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
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
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
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
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
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
}

export const useUser = (eid: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['user', eid],
    queryFn: async () => {
      const res = await userService.getById(eid)
      return res.data
    },
    enabled: !!eid && (options.enabled ?? true),
    staleTime: 30 * 1000,
  })
}

export const useUserMenuPermissions = (
  id: string | number,
  options: IUserPermissionQueryOptions = {}
) => {
  return useQuery({
    queryKey: ['user-permissions', id, 'menu'],
    queryFn: async () => {
      const response = await userService.getUserMenuPermissions(id)
      return response.data
    },
    enabled: !!id && (options.enabled ?? true),
    staleTime: USER_PERMISSION_STALE_TIME,
    gcTime: USER_PERMISSION_GC_TIME,
  })
}

export const useUserReportPermissions = (
  id: string | number,
  options: IUserPermissionQueryOptions = {}
) => {
  return useQuery({
    queryKey: ['user-permissions', id, 'report'],
    queryFn: async () => {
      const response = await userService.getUserReportPermissions(id)
      return response.data
    },
    enabled: !!id && (options.enabled ?? true),
    staleTime: USER_PERMISSION_STALE_TIME,
    gcTime: USER_PERMISSION_GC_TIME,
  })
}

export const useUserCoaAccess = (
  id: string | number,
  options: IUserPermissionQueryOptions = {}
) => {
  return useQuery({
    queryKey: ['user-permissions', id, 'coa'],
    queryFn: async () => {
      const response = await userService.getUserCoaAccess(id)
      return response.data
    },
    enabled: !!id && (options.enabled ?? true),
    staleTime: USER_PERMISSION_STALE_TIME,
    gcTime: USER_PERMISSION_GC_TIME,
  })
}

export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
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
}

// Keep factory for backward compatibility
export const useUsers = () => {
  return {
    useUsersList,
    useUser,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
    useUserMenuPermissions,
    useUserReportPermissions,
    useUserCoaAccess,
    useUpdateUserPermissions,
  }
}
