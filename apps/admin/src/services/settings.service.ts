import api from './api';
import type { ApiResponse, Setting } from '../types';

export const settingsService = {
  /** List all settings (admin). */
  list: () =>
    api.get<ApiResponse<Setting[]>>('/settings').then((response) => response.data.data),

  /** Update a setting by key. */
  update: (key: string, value: string) =>
    api
      .patch<ApiResponse<Setting>>(`/settings/${key}`, { value })
      .then((response) => response.data.data),
};
