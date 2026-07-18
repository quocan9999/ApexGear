import type { Role } from './enums';

export const STAFF_ROLES: readonly Role[] = [
  'ADMIN',
  'CONTENT_MANAGER',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
];

export const ALL_STAFF_ROLES = STAFF_ROLES;
export const CONTENT_ROLES: readonly Role[] = ['ADMIN', 'CONTENT_MANAGER'];

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}
