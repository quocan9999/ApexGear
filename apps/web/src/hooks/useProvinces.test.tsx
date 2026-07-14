import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../services/provinces.service', () => ({
  provincesService: {
    getProvinces: vi.fn().mockResolvedValue([{ code: '79', name: 'TP HCM' }]),
    getDistricts: vi.fn().mockResolvedValue([{ code: '760', name: 'Quan 1' }]),
    getWards: vi.fn().mockResolvedValue([{ code: '26734', name: 'Ben Nghe' }]),
  },
}));
import { provincesService } from '../services/provinces.service';
import { useProvinces } from './useProvinces';

beforeEach(() => vi.clearAllMocks());

describe('useProvinces', () => {
  it('loads provinces on mount', async () => {
    const { result } = renderHook(() => useProvinces());
    await waitFor(() => expect(result.current.provinces).toHaveLength(1));
  });

  it('loads districts after selecting a province and wards after a district', async () => {
    const { result } = renderHook(() => useProvinces());
    await waitFor(() => expect(result.current.provinces).toHaveLength(1));
    act(() => result.current.selectProvince('79'));
    await waitFor(() => expect(provincesService.getDistricts).toHaveBeenCalledWith('79'));
    await waitFor(() => expect(result.current.districts).toHaveLength(1));
    act(() => result.current.selectDistrict('760'));
    await waitFor(() => expect(provincesService.getWards).toHaveBeenCalledWith('760'));
    await waitFor(() => expect(result.current.wards).toHaveLength(1));
  });

  it('resets districts and wards when the province changes', async () => {
    const { result } = renderHook(() => useProvinces());
    await waitFor(() => expect(result.current.provinces).toHaveLength(1));
    act(() => result.current.selectProvince('79'));
    await waitFor(() => expect(result.current.districts).toHaveLength(1));
    act(() => result.current.selectProvince('01'));
    expect(result.current.wards).toHaveLength(0);
  });
});
