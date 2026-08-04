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

  private sortByName<T extends { name: string }>(items: T[]): T[] {
    const stripPrefix = (name: string) => {
      return name
        .replace(/^(Tỉnh|Thành phố|Phường|Xã|Thị trấn)\s+/i, '')
        .trim();
    };

    return items.sort((a, b) => {
      const nameA = stripPrefix(a.name);
      const nameB = stripPrefix(b.name);
      return nameA.localeCompare(nameB, 'vi');
    });
  }

  async fetchProvinces() {
    return this.cached('provinces', async () => {
      try {
        const res = await fetch(`${API_BASE}/p/`);
        if (!res.ok) {
          throw new Error(`Provinces API error: ${res.status}`);
        }
        const data = await res.json();
        return this.sortByName(data);
      } catch (error) {
        this.logger.warn(`Provinces API failed, using fallback: ${(error as Error).message}`);
        const { provincesData } = require('./data/provinces.data');
        const mapped = provincesData.map((p: any) => ({ ...p, wards: [] }));
        return this.sortByName(mapped);
      }
    });
  }

  async fetchWards(provinceCode: string) {
    return this.cached(`wards:${provinceCode}`, async () => {
      try {
        const res = await fetch(`${API_BASE}/p/${provinceCode}?depth=2`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new NotFoundException('Province not found');
          }
          throw new Error(`Provinces API error: ${res.status}`);
        }
        const data = (await res.json()) as { wards?: any[] };
        return this.sortByName(data.wards ?? []);
      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        
        this.logger.warn(`Wards API failed for ${provinceCode}, using fallback: ${(error as Error).message}`);
        const { provincesData } = require('./data/provinces.data');
        const province = provincesData.find((p: any) => p.code.toString() === provinceCode.toString());
        if (!province) {
          throw new NotFoundException('Province not found');
        }
        return this.sortByName(province.wards ?? []);
      }
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
