import { Injectable, Logger, NotFoundException } from '@nestjs/common';

// v2 serves the post–1 July 2025 administrative reform: a 2-tier model
// (province/city -> ward, with districts abolished) and 34 merged provinces.
// So there is no district level — wards are fetched directly under a province.
const API_BASE = 'https://provinces.open-api.vn/api/v2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry<T> = { data: T; expiresAt: number };

@Injectable()
export class ProvincesService {
  private readonly logger = new Logger(ProvincesService.name);
  private cache = new Map<string, CacheEntry<unknown>>();

  async fetchProvinces() {
    return this.cached('provinces', async () => {
      const res = await fetch(`${API_BASE}/p/`);
      if (!res.ok) {
        throw new Error(`Provinces API error: ${res.status}`);
      }
      return res.json();
    });
  }

  async fetchWards(provinceCode: string) {
    return this.cached(`wards:${provinceCode}`, async () => {
      const res = await fetch(`${API_BASE}/p/${provinceCode}?depth=2`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new NotFoundException('Province not found');
        }
        throw new Error(`Provinces API error: ${res.status}`);
      }
      const data = (await res.json()) as { wards?: unknown[] };
      // Always return an array — never the raw province object, or the
      // frontend's wards.map() gets a non-iterable and the select breaks.
      return data.wards ?? [];
    });
  }

  private async cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.data as T;
    }
    try {
      const data = await loader();
      this.cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    } catch (error) {
      this.logger.error(`Failed to load ${key}`, error);
      throw error;
    }
  }
}
