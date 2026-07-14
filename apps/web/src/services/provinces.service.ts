import api from './api';
import type { ApiResponse, Province, District, Ward } from '../types';

export const provincesService = {
  getProvinces: () =>
    api.get<ApiResponse<Province[]>>('/provinces').then((r) => r.data.data ?? []),

  getDistricts: (provinceCode: string) =>
    api.get<ApiResponse<District[]>>(`/provinces/${provinceCode}/districts`).then((r) => r.data.data ?? []),

  getWards: (districtCode: string) =>
    api.get<ApiResponse<Ward[]>>(`/districts/${districtCode}/wards`).then((r) => r.data.data ?? []),
};
