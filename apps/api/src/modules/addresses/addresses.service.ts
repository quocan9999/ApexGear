import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

const MAX_ADDRESSES = 10;

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    const count = await this.prisma.address.count({ where: { userId } });
    if (count >= MAX_ADDRESSES) {
      throw new BadRequestException(
        `Maximum ${MAX_ADDRESSES} addresses allowed`,
      );
    }

    const makeDefault = dto.isDefault === true || count === 0;

    if (makeDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        provinceCode: dto.provinceCode,
        provinceName: dto.provinceName,
        districtCode: dto.districtCode,
        districtName: dto.districtName,
        wardCode: dto.wardCode,
        wardName: dto.wardName,
        detail: dto.detail,
        isDefault: makeDefault,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    await this.ensureOwned(userId, id);

    if (dto.isDefault === true) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    const address = await this.ensureOwned(userId, id);
    await this.prisma.address.delete({ where: { id } });

    if (address.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Address deleted successfully' };
  }

  async setDefault(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
    return this.prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  private async ensureOwned(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) {
      throw new ForbiddenException('Not your address');
    }
    return address;
  }
}
