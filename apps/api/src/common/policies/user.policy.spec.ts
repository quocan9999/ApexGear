import { ForbiddenException } from '@nestjs/common';
import { Role } from '../enums';
import {
  assertCanAssignRole,
  assertCanManageStaffTarget,
  assertCanMutateCustomer,
  assertCanRestoreStaff,
  assertStaffResourceAccess,
} from './user.policy';

describe('user policy', () => {
  it('allows SUPER_ADMIN to manage other staff but never self or SUPER_ADMIN', () => {
    expect(() => assertCanManageStaffTarget(Role.ADMIN, Role.SUPER_ADMIN, 'actor')).toThrow(ForbiddenException);
    expect(() => assertCanManageStaffTarget(Role.SUPER_ADMIN, Role.CONTENT_MANAGER, 'actor')).not.toThrow();
    expect(() => assertCanManageStaffTarget(Role.SUPER_ADMIN, Role.ADMIN, 'same', 'same')).toThrow(ForbiddenException);
  });

  it('allows ADMIN to manage lower staff but not ADMIN or SUPER_ADMIN', () => {
    expect(() => assertCanManageStaffTarget(Role.ADMIN, Role.ORDER_MANAGER, 'actor')).not.toThrow();
    expect(() => assertCanManageStaffTarget(Role.ADMIN, Role.ADMIN, 'actor')).toThrow(ForbiddenException);
    expect(() => assertCanManageStaffTarget(Role.ADMIN, Role.SUPER_ADMIN, 'actor')).toThrow(ForbiddenException);
  });

  it('restricts customer and staff resources to ADMIN and SUPER_ADMIN', () => {
    expect(() => assertStaffResourceAccess(Role.CONTENT_MANAGER)).toThrow(ForbiddenException);
    expect(() => assertStaffResourceAccess(Role.ADMIN)).not.toThrow();
    expect(() => assertCanMutateCustomer(Role.SUPER_ADMIN)).not.toThrow();
    expect(() => assertCanMutateCustomer(Role.ORDER_MANAGER)).toThrow(ForbiddenException);
  });

  it('does not allow SUPER_ADMIN assignment and only SUPER_ADMIN restores staff', () => {
    expect(() => assertCanAssignRole(Role.SUPER_ADMIN, Role.SUPER_ADMIN)).toThrow(ForbiddenException);
    expect(() => assertCanAssignRole(Role.ADMIN, Role.ADMIN)).toThrow(ForbiddenException);
    expect(() => assertCanAssignRole(Role.SUPER_ADMIN, Role.ADMIN)).not.toThrow();
    expect(() => assertCanRestoreStaff(Role.ADMIN, Role.CONTENT_MANAGER)).toThrow(ForbiddenException);
    expect(() => assertCanRestoreStaff(Role.SUPER_ADMIN, Role.CONTENT_MANAGER)).not.toThrow();
  });
});
