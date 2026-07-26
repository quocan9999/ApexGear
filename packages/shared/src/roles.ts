import type { Role } from './enums';

export const STAFF_ROLES: readonly Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'CONTENT_MANAGER',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
];

export const ALL_STAFF_ROLES = STAFF_ROLES;
export const CONTENT_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'];
export const CUSTOMER_MANAGER_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN'];
export const STAFF_MANAGER_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN'];
export const SUPER_ADMIN_ROLES: readonly Role[] = ['SUPER_ADMIN'];
export const ASSIGNABLE_STAFF_ROLES: readonly Role[] = [
  'ADMIN',
  'CONTENT_MANAGER',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
];

export type Resource = 'customers' | 'staff';
export type PolicyAction = 'view' | 'manage' | 'restore';

export function canViewResource(role: Role, resource: Resource): boolean {
  if (resource === 'customers' || resource === 'staff') return CUSTOMER_MANAGER_ROLES.includes(role);
  return false;
}

export function canAssignRole(actor: Role, targetRole: Role): boolean {
  if (!ASSIGNABLE_STAFF_ROLES.includes(targetRole)) return false;
  if (targetRole === 'ADMIN') return actor === 'SUPER_ADMIN';
  return actor === 'SUPER_ADMIN' || actor === 'ADMIN';
}

export function canManageTarget(actor: Role, targetRole: Role, sameUser = false): boolean {
  if (sameUser || targetRole === 'SUPER_ADMIN') return false;
  if (actor === 'SUPER_ADMIN') return STAFF_ROLES.includes(targetRole);
  if (actor === 'ADMIN') {
    return (
      targetRole === 'CONTENT_MANAGER' ||
      targetRole === 'INVENTORY_MANAGER' ||
      targetRole === 'ORDER_MANAGER'
    );
  }
  return false;
}

export function canMutateCustomer(actor: Role): boolean {
  return CUSTOMER_MANAGER_ROLES.includes(actor);
}

export function canRestoreStaff(actor: Role, targetRole: Role): boolean {
  return actor === 'SUPER_ADMIN' && targetRole !== 'SUPER_ADMIN';
}


export function isCustomerRole(role: Role): boolean {
  return role === 'CUSTOMER';
}

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

