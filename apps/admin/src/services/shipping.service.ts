import api from './api';

export interface ShippingRule {
  id: string;
  name: string;
  fee: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
};
