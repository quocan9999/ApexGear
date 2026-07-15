import api from './api';
import type { DashboardStats, RevenuePoint } from '../types';

export const dashboardService = {
  getStats: () =>
    api.get('/dashboard/stats').then((r) => r.data.data as DashboardStats),
  getRevenue: (days: 7 | 30) =>
    api
      .get('/dashboard/revenue', { params: { days } })
      .then((r) => r.data.data as RevenuePoint[]),
};
