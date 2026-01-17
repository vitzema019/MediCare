/**
 * Step-by-step:
 * 1) Reads request.user (set by JwtStrategy).
 * 2) If a field key is provided, returns only that field.
 * 3) Otherwise returns the full JwtPayload.
 * Uses: JwtPayload type.
 * Used by: controllers needing user id/role (patients, doctors, reservations).
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
