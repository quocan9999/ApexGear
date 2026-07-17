import { useCallback, useEffect, useState } from 'react';
import { provincesService, type Province, type Ward } from '../services/provinces.service';

export interface UseProvincesResult {
  provinces: Province[];
  wards: Ward[];
  selectedProvince: Province | null;
  selectedWard: Ward | null;
  selectProvince: (code: string) => void;
  selectWard: (code: string) => void;
  loading: boolean;
}

// 2-tier VN administrative model (v2, post-2025 merger): province/city -> ward.
// Districts were abolished, so there is no intermediate level here.
export function useProvinces(): UseProvincesResult {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    provincesService
      .getProvinces()
      .then((data) => {
        if (!cancelled) setProvinces(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectProvince = useCallback(
    (code: string) => {
      const province = provinces.find((p) => p.code === code) ?? null;
      setSelectedProvince(province);
      // Reset the downstream ward selection whenever the province changes.
      setSelectedWard(null);
      setWards([]);
      if (!province) return;
      setLoading(true);
      provincesService
        .getWards(code)
        .then(setWards)
        .finally(() => setLoading(false));
    },
    [provinces],
  );

  const selectWard = useCallback(
    (code: string) => {
      const ward = wards.find((w) => w.code === code) ?? null;
      setSelectedWard(ward);
    },
    [wards],
  );

  return {
    provinces,
    wards,
    selectedProvince,
    selectedWard,
    selectProvince,
    selectWard,
    loading,
  };
}
