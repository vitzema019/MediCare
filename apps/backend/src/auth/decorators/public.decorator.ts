/**
 * Step-by-step:
 * 1) Sets IS_PUBLIC_KEY metadata to true.
 * 2) JwtAuthGuard checks this flag and skips auth.
 * Uses: JwtAuthGuard.
 * Used by: controllers that should be public (health, login, public data).
 */
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
