/**
 * Step-by-step:
 * 1) Attaches ROLES_KEY metadata with allowed roles.
 * 2) RolesGuard reads this metadata to authorize access.
 * Uses: RolesGuard.
 * Used by: controllers that require role-based access.
 */
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../dto/login.dto';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
