import {
  getCompanySettingsFn,
  updateCompanySettingsFn,
  getNumberSettingsFn,
  updateNumberSettingsFn,
} from '@/server/functions/admin/settings'
import type { ISettingsCompany, ISettingsNumbering } from '@/domains/settings/types/settings'
import type { IAPIResponse } from '@/shared/types/api'

export const settingService = {
  getCompany: async (): Promise<IAPIResponse<ISettingsCompany>> => {
    const result = await getCompanySettingsFn()
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  updateCompany: async (data: ISettingsCompany): Promise<IAPIResponse<ISettingsCompany>> => {
    const result = await updateCompanySettingsFn({ data: { body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  getNumbering: async (): Promise<IAPIResponse<ISettingsNumbering>> => {
    const result = await getNumberSettingsFn()
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  updateNumbering: async (data: ISettingsNumbering): Promise<IAPIResponse<ISettingsNumbering>> => {
    const result = await updateNumberSettingsFn({ data: { body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },
}
