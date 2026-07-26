import { ForbiddenException } from '@nestjs/common';
import { Role } from '../enums';
import {
  canAssignRole,
  canManageTarget,
  canMutateCustomer,
  canRestoreStaff,
  canViewResource,
} from '@apexgear/shared';

export function assertStaffResourceAccess(actorRole: Role): void {
  if (!canViewResource(actorRole, 'staff')) {
    throw new ForbiddenException('Staff management is not allowed');
  }
}

export function assertCustomerResourceAccess(actorRole: Role): void {
  if (!canViewResource(actorRole, 'customers')) {
    throw new ForbiddenException('Customer management is not allowed');
  }
}

export function assertCanMutateCustomer(actorRole: Role): void {
  if (!canMutateCustomer(actorRole)) {
    throw new ForbiddenException('Customer management is not allowed');
  }
}

export function assertCanAssignRole(actorRole: Role, targetRole: Role): void {
  if (!canAssignRole(actorRole, targetRole)) {
    throw new ForbiddenException('Role assignment is not allowed');
  }
}

export function assertCanManageStaffTarget(
  actorRole: Role,
  targetRole: Role,
  actorId: string,
  targetId?: string,
): void {
  if (!canManageTarget(actorRole, targetRole, actorId === targetId)) {
    throw new ForbiddenException('Staff target management is not allowed');
  }
}

export function assertCanRestoreStaff(actorRole: Role, targetRole: Role): void {
  if (!canRestoreStaff(actorRole, targetRole)) {
    throw new ForbiddenException('Staff restore is not allowed');
  }
}
