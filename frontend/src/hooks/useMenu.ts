import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { menuService } from '@/services/menuService'
import { IDbMenu } from '@/types/menu';
import { useToast } from '@/hooks/use-toast'

export const menuKeys = {
  all: ['menus'] as const,
  paginated: (page: number, limit: number, search: string) => ['menus', 'paginated', page, limit, search] as const,
  parents: (level: number) => ['parentMenus', level] as const,
}

export function useMenus(page: number = 1, limit: number = 10, search: string = '') {
  return useQuery({
    queryKey: menuKeys.paginated(page, limit, search),
    queryFn: () => menuService.getPaginatedMenus(page, limit, search)
  })
}

export function useParentMenus(level: number) {
  return useQuery({
    queryKey: menuKeys.parents(level),
    queryFn: () => menuService.getParentMenus(level - 1),
    enabled: level > 0
  })
}

export function useCreateMenu(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: IDbMenu) => menuService.createMenu(data),
    onSuccess: () => {
      toast({ title: 'Berhasil', description: 'Menu berhasil ditambahkan' })
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
      if (onSuccessCallback) onSuccessCallback()
    },
    onError: (error: any) => {
      toast({ title: 'Gagal', description: error.message || 'Gagal menambahkan menu', variant: 'destructive' })
    }
  })
}

export function useUpdateMenu(kodeLama: string, onSuccessCallback?: () => void) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: IDbMenu) => menuService.updateMenu(kodeLama, data),
    onSuccess: () => {
      toast({ title: 'Berhasil', description: 'Menu berhasil diperbarui' })
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
      if (onSuccessCallback) onSuccessCallback()
    },
    onError: (error: any) => {
      toast({ title: 'Gagal', description: error.message || 'Gagal memperbarui menu', variant: 'destructive' })
    }
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (kode: string) => menuService.deleteMenu(kode),
    onSuccess: () => {
      toast({ title: 'Berhasil', description: 'Menu berhasil dihapus' })
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
    },
    onError: (error: any) => {
      toast({ title: 'Gagal', description: error.message || 'Gagal menghapus menu', variant: 'destructive' })
    }
  })
}
