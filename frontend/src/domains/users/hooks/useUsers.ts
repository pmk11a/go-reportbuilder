import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/domains/users/services/userService'
import { useToast } from '@/shared/hooks/use-toast'
import { formatAPIError } from '@/shared/utils/errorMapper'
import {
  ICreateUserPayload,
  IUpdateUserPayload,
  IUserPermission,
  IUserCoaAccess,
} from '../types/user'

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

// ─── Standalone hooks (prefer these — no factory call needed) ────────────────

export function useUsersList( page: number, limit: number, search: string, status: string ) {
  return useQuery( {
    queryKey: [ 'users', { page, limit, search, status } ],
    queryFn: async () => {
      const response = await userService.list( { page, limit, search, status } )
      return response
    },
  } )
}

export function useUser( eid: string, options: { enabled?: boolean } = {} ) {
  return useQuery( {
    queryKey: [ 'user', eid ],
    queryFn: async () => {
      const res = await userService.getById( eid )
      return res.data
    },
    enabled: !!eid && ( options.enabled ?? true ),
    staleTime: 30 * 1000,
  } )
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation( {
    mutationFn: async ( data: ICreateUserPayload ) => {
      const response = await userService.create( data )
      return response.data
    },
    onSuccess: () => {
      toast( { title: 'Success', description: 'User created successfully', variant: 'success' } )
      queryClient.invalidateQueries( { queryKey: [ 'users' ] } )
    },
    onError: ( error: any ) => {
      const errorMsg = error.response
        ? formatAPIError( error.response.status, error.message )
        : error.message
      toast( { title: 'Error', description: errorMsg || 'Failed to create user', variant: 'destructive' } )
    },
  } )
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation( {
    mutationFn: async ( { id, data }: { id: string | number; data: IUpdateUserPayload } ) => {
      const response = await userService.update( id, data )
      return response.data
    },
    onSuccess: ( _data, variables ) => {
      toast( { title: 'Success', description: 'User updated successfully', variant: 'success' } )
      queryClient.invalidateQueries( { queryKey: [ 'users' ] } )
      queryClient.invalidateQueries( { queryKey: [ 'user', String( variables.id ) ] } )
    },
    onError: ( error: any ) => {
      const errorMsg = error.response
        ? formatAPIError( error.response.status, error.message )
        : error.message
      toast( { title: 'Error', description: errorMsg || 'Failed to update user', variant: 'destructive' } )
    },
  } )
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation( {
    mutationFn: async ( id: string | number ) => {
      await userService.delete( id )
    },
    onSuccess: () => {
      toast( { title: 'Success', description: 'User deleted successfully', variant: 'success' } )
      queryClient.invalidateQueries( { queryKey: [ 'users' ] } )
    },
    onError: ( error: any ) => {
      const errorMsg = error.response
        ? formatAPIError( error.response.status, error.message )
        : error.message
      toast( { title: 'Error', description: errorMsg || 'Failed to delete user', variant: 'destructive' } )
    },
  } )
}

/**
 * Per-tab hook: fetch ONLY the menu permission rows for a user.
 * Cache key: ['user-permissions', id, 'menu']
 */
export function useUserMenuPermissions(
  id: string | number,
  options: IUserPermissionQueryOptions = {}
) {
  return useQuery( {
    queryKey: [ 'user-permissions', id, 'menu' ],
    queryFn: async () => {
      const response = await userService.getUserMenuPermissions( id )
      return response.data
    },
    enabled: !!id && ( options.enabled ?? true ),
    staleTime: USER_PERMISSION_STALE_TIME,
    gcTime: USER_PERMISSION_GC_TIME,
  } )
}

/**
 * Per-tab hook: fetch ONLY the report permission rows for a user.
 * Cache key: ['user-permissions', id, 'report']
 */
export function useUserReportPermissions(
  id: string | number,
  options: IUserPermissionQueryOptions = {}
) {
  return useQuery( {
    queryKey: [ 'user-permissions', id, 'report' ],
    queryFn: async () => {
      const response = await userService.getUserReportPermissions( id )
      return response.data
    },
    enabled: !!id && ( options.enabled ?? true ),
    staleTime: USER_PERMISSION_STALE_TIME,
    gcTime: USER_PERMISSION_GC_TIME,
  } )
}

/**
 * Per-tab hook: fetch ONLY the COA access rows for a user.
 * Cache key: ['user-permissions', id, 'coa']
 */
export function useUserCoaAccess(
  id: string | number,
  options: IUserPermissionQueryOptions = {}
) {
  return useQuery( {
    queryKey: [ 'user-permissions', id, 'coa' ],
    queryFn: async () => {
      const response = await userService.getUserCoaAccess( id )
      return response.data
    },
    enabled: !!id && ( options.enabled ?? true ),
    staleTime: USER_PERMISSION_STALE_TIME,
    gcTime: USER_PERMISSION_GC_TIME,
  } )
}

/**
 * Mutation: update all 3 permission categories in one transaction.
 * On success, invalidates ALL 3 per-tab caches for the affected user so
 * that subsequent reads return fresh server data.
 */
export function useUpdateUserPermissions() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation( {
    mutationFn: async ( {
      id,
      data,
    }: {
      id: string | number
      data: { menu: IUserPermission[]; report: IUserPermission[]; coa: IUserCoaAccess[] }
    } ) => {
      const response = await userService.updatePermissions( id, data )
      return response.data
    },
    onSuccess: ( _, variables ) => {
      toast( {
        title: 'Success',
        description: 'User permissions updated successfully',
        variant: 'success',
      } )
      queryClient.invalidateQueries( { queryKey: [ 'user-permissions', variables.id, 'menu' ] } )
      queryClient.invalidateQueries( { queryKey: [ 'user-permissions', variables.id, 'report' ] } )
      queryClient.invalidateQueries( { queryKey: [ 'user-permissions', variables.id, 'coa' ] } )
    },
    onError: ( error: any ) => {
      const errorMsg = error.response
        ? formatAPIError( error.response.status, error.message )
        : error.message
      toast( {
        title: 'Error',
        description: errorMsg || 'Failed to update user permissions',
        variant: 'destructive',
      } )
    },
  } )
}

// ─── Legacy factory (kept for backward compatibility) ────────────────────────

/**
 * Legacy factory for callers that do `const { useCreateUser } = useUsers()`.
 * New code should import hooks directly (useCreateUser, useUser, etc.).
 */
export const useUsers = () => {
  const qc = useQueryClient()
  const { toast } = useToast()

  const _useUsersList = ( page: number, limit: number, search: string, status: string ) => useQuery( {
    queryKey: [ 'users', { page, limit, search, status } ],
    queryFn: async () => {
      const response = await userService.list( { page, limit, search, status } )
      return response
    },
  } )

  const _useCreateUser = () => useMutation( {
    mutationFn: async ( data: ICreateUserPayload ) => {
      const response = await userService.create( data )
      return response.data
    },
    onSuccess: () => {
      toast( { title: 'Success', description: 'User created successfully', variant: 'success' } )
      qc.invalidateQueries( { queryKey: [ 'users' ] } )
    },
    onError: ( error: any ) => {
      const errorMsg = error.response
        ? formatAPIError( error.response.status, error.message )
        : error.message
      toast( { title: 'Error', description: errorMsg || 'Failed to create user', variant: 'destructive' } )
    },
  } )

  const _useUpdateUser = () => useMutation( {
    mutationFn: async ( { id, data }: { id: string | number; data: IUpdateUserPayload } ) => {
      const response = await userService.update( id, data )
      return response.data
    },
    onSuccess: ( _data, variables ) => {
      toast( { title: 'Success', description: 'User updated successfully', variant: 'success' } )
      qc.invalidateQueries( { queryKey: [ 'users' ] } )
      qc.invalidateQueries( { queryKey: [ 'user', String( variables.id ) ] } )
    },
    onError: ( error: any ) => {
      const errorMsg = error.response
        ? formatAPIError( error.response.status, error.message )
        : error.message
      toast( { title: 'Error', description: errorMsg || 'Failed to update user', variant: 'destructive' } )
    },
  } )

  const _useDeleteUser = () => useMutation( {
    mutationFn: async ( id: string | number ) => {
      await userService.delete( id )
    },
    onSuccess: () => {
      toast( { title: 'Success', description: 'User deleted successfully', variant: 'success' } )
      qc.invalidateQueries( { queryKey: [ 'users' ] } )
    },
    onError: ( error: any ) => {
      const errorMsg = error.response
        ? formatAPIError( error.response.status, error.message )
        : error.message
      toast( { title: 'Error', description: errorMsg || 'Failed to delete user', variant: 'destructive' } )
    },
  } )

  const _useUser = ( eid: string, options: { enabled?: boolean } = {} ) => useQuery( {
    queryKey: [ 'user', eid ],
    queryFn: async () => {
      const res = await userService.getById( eid )
      return res.data
    },
    enabled: !!eid && ( options.enabled ?? true ),
    staleTime: 30 * 1000,
  } )

  return {
    useUsersList: _useUsersList,
    useUser: _useUser,
    useCreateUser: _useCreateUser,
    useUpdateUser: _useUpdateUser,
    useDeleteUser: _useDeleteUser,
    useUserMenuPermissions: useUserMenuPermissions,
    useUserReportPermissions: useUserReportPermissions,
    useUserCoaAccess: useUserCoaAccess,
    useUpdateUserPermissions: useUpdateUserPermissions,
  }
}
