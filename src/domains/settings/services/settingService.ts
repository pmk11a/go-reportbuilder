import {
  getCompanySettingsFn,
  updateCompanySettingsFn,
  getNumberSettingsFn,
  updateNumberSettingsFn,
} from '@/server/functions/admin/settings'
import type { ISettingsCompany, ISettingsNumbering } from '@/domains/settings/settings'
import type { IAPIResponse } from '@/shared/types/api'

export const settingService = {
  getCompany: async (): Promise<IAPIResponse<ISettingsCompany>> => {
    const result = await getCompanySettingsFn()
    return result as IAPIResponse<ISettingsCompany>
  },

  updateCompany: async (data: ISettingsCompany): Promise<IAPIResponse<ISettingsCompany>> => {
    const result = await updateCompanySettingsFn({ data: { body: data } })
    return result as IAPIResponse<ISettingsCompany>
  },

  getNumbering: async (): Promise<IAPIResponse<ISettingsNumbering>> => {
    const result = await getNumberSettingsFn()
    return result as IAPIResponse<ISettingsNumbering>
  },

  updateNumbering: async (data: ISettingsNumbering): Promise<IAPIResponse<ISettingsNumbering>> => {
    const result = await updateNumberSettingsFn({ data: { body: data } })
    return result as IAPIResponse<ISettingsNumbering>
  },
}
