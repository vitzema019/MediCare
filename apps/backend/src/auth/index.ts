/**
 * Step-by-step:
 * 1) Re-exports auth modules, services, guards, and decorators.
 * 2) Allows importing auth pieces from a single path.
 * Uses: all auth files in this folder.
 * Used by: optional barrel imports (not required by Nest).
 */
export * from './auth.module';
export * from './auth.service';
export * from './auth.controller';
export * from './jwt.strategy';
export * from './guards/jwt-auth.guard';
export * from './guards/roles.guard';
export * from './decorators/roles.decorator';
export * from './decorators/current-user.decorator';
export * from './decorators/public.decorator';
export * from './dto/login.dto';
