import { useCallback, useEffect, useState } from 'react';
import { provincesService } from '../services/provinces.service';
import type { Province, District, Ward } from '../types';

export interface UseProvincesResult {
  provinces: Province[];
  districts: District[];
  wards: Ward[];
  selectedProvince: Province | null;
  selectedDistrict: District | null;
  selectedWard: Ward | null;
  selectProvince: (code: string) => void;
  selectDistrict: (code: string) => void;
  selectWard: (code: string) => void;
  loading: boolean;
}

export function useProvinces(): UseProvincesResult {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
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
      // Reset downstream selections whenever the province changes.
      setSelectedDistrict(null);
      setSelectedWard(null);
      setDistricts([]);
      setWards([]);
      if (!province) return;
      setLoading(true);
      provincesService
        .getDistricts(code)
        .then(setDistricts)
        .finally(() => setLoading(false));
    },
    [provinces],
  );

  const selectDistrict = useCallback(
    (code: string) => {
      const district = districts.find((d) => d.code === code) ?? null;
      setSelectedDistrict(district);
      setSelectedWard(null);
      setWards([]);
      if (!district) return;
      setLoading(true);
      provincesService
        .getWards(code)
        .then(setWards)
        .finally(() => setLoading(false));
    },
    [districts],
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
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    selectProvince,
    selectDistrict,
    selectWard,
    loading,
  };
}
