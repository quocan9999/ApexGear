import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../services/provinces.service', () => ({
  provincesService: {
    getProvinces: vi.fn().mockResolvedValue([{ code: '79', name: 'TP HCM' }]),
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

  it('loads wards after selecting a province', async () => {
    const { result } = renderHook(() => useProvinces());
    await waitFor(() => expect(result.current.provinces).toHaveLength(1));
    act(() => result.current.selectProvince('79'));
    await waitFor(() => expect(provincesService.getWards).toHaveBeenCalledWith('79'));
    await waitFor(() => expect(result.current.wards).toHaveLength(1));
    act(() => result.current.selectWard('26734'));
    await waitFor(() => expect(result.current.selectedWard?.code).toBe('26734'));
  });

  it('resets wards when the province changes', async () => {
    const { result } = renderHook(() => useProvinces());
    await waitFor(() => expect(result.current.provinces).toHaveLength(1));
    act(() => result.current.selectProvince('79'));
    await waitFor(() => expect(result.current.wards).toHaveLength(1));
    act(() => result.current.selectProvince('01'));
    expect(result.current.selectedWard).toBeNull();
  });
});
