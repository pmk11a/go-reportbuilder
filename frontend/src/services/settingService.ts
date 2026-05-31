import { fetchHelper } from '@/lib/api';
import type { ISettingsCompany, ISettingsNumbering } from '@/types/settings';
import type { IAPIResponse } from '@/types/api';

export const settingService = {
  getCompany: async (): Promise<IAPIResponse<ISettingsCompany>> => {
    return await fetchHelper<IAPIResponse<ISettingsCompany>>('/admin/settings/company');
  },

  updateCompany: async (data: ISettingsCompany): Promise<IAPIResponse<ISettingsCompany>> => {
    return await fetchHelper<IAPIResponse<ISettingsCompany>>('/admin/settings/company', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getNumbering: async (): Promise<IAPIResponse<ISettingsNumbering>> => {
    return await fetchHelper<IAPIResponse<ISettingsNumbering>>('/admin/settings/numbers');
  },

  updateNumbering: async (data: ISettingsNumbering): Promise<IAPIResponse<ISettingsNumbering>> => {
    return await fetchHelper<IAPIResponse<ISettingsNumbering>>('/admin/settings/numbers', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
