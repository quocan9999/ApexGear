import api from './api';
import type { ApiResponse, Province, Ward } from '../types';

// The VN provinces API v2 (post-2025 merger) is 2-tier: province -> ward, with
// districts abolished. `code` comes back as a number, but the <select> value is
// always a string, so normalize here or find((x) => x.code === value) never
// matches an unnormalized number.
interface RawLocation {
  code: string | number;
  name: string;
}

const normalize = <T extends { code: string; name: string }>(
  items: RawLocation[] | null | undefined,
): T[] => (items ?? []).map((i) => ({ code: String(i.code), name: i.name }) as T);

export const provincesService = {
  getProvinces: () =>
    api
      .get<ApiResponse<RawLocation[]>>('/provinces')
      .then((r) => normalize<Province>(r.data.data)),

  getWards: (provinceCode: string) =>
    api
      .get<ApiResponse<RawLocation[]>>(`/provinces/${provinceCode}/wards`)
      .then((r) => normalize<Ward>(r.data.data)),
};
