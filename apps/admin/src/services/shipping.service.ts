import api from './api';

export interface ShippingRegion {
  id: string;
  ruleId: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string | null;
  wardName: string | null;
}

export interface ShippingRule {
  id: string;
  name: string;
  fee: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  regions: ShippingRegion[];
}

export const shippingService = {
  getRules: () =>
    api.get<{ success: boolean; data: ShippingRule[] }>('/shipping/rules').then((r) => r.data.data),

  createRule: (data: { name: string; fee: number; isDefault?: boolean; isActive?: boolean }) =>
    api.post<{ success: boolean; data: ShippingRule }>('/shipping/rules', data).then((r) => r.data.data),

  updateRule: (id: string, data: Partial<{ name: string; fee: number; isDefault: boolean; isActive: boolean }>) =>
    api.put<{ success: boolean; data: ShippingRule }>(`/shipping/rules/${id}`, data).then((r) => r.data.data),

  deleteRule: (id: string) =>
    api.delete<{ success: boolean; data: any }>(`/shipping/rules/${id}`).then((r) => r.data.data),

  addRegion: (ruleId: string, data: { provinceCode: string; provinceName: string; wardCode?: string; wardName?: string }) =>
    api.post<{ success: boolean; data: ShippingRegion }>(`/shipping/rules/${ruleId}/regions`, data).then((r) => r.data.data),

  removeRegion: (ruleId: string, regionId: string) =>
    api.delete<{ success: boolean; data: any }>(`/shipping/rules/${ruleId}/regions/${regionId}`).then((r) => r.data.data),
};
