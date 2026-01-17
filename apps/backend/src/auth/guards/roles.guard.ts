/**
 * Step-by-step:
 * 1) Reads @Roles metadata from handler/class.
 * 2) If no roles defined, allows request.
 * 3) Compares request.user.role to required roles.
 * Uses: Roles decorator metadata, JwtPayload.
 * Used by: controllers that add @Roles.
 */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../dto/login.dto';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const jwtPayload = user as JwtPayload;
    return requiredRoles.some((role) => jwtPayload?.role === role);
  }
}
