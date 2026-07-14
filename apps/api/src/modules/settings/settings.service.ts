import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const PUBLIC_KEYS = ['shipping_fee', 'store_name'] as const;

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  async get(key: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    return setting;
  }

  async update(key: string, value: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getPublicSettings() {
    const settings = await this.prisma.setting.findMany({
      where: { key: { in: [...PUBLIC_KEYS] } },
    });
    const map: Record<string, string> = {
      shipping_fee: '30000',
      store_name: 'ApexGear',
    };
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return map;
  }
}
