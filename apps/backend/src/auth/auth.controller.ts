/**
 * Step-by-step:
 * 1) Exposes /auth/login and marks it @Public (no JWT required).
 * 2) Validates incoming payload with LoginDto (class-validator + Swagger).
 * 3) Delegates credential checks to AuthService.login.
 * 4) Returns LoginResponseDto (JWT + basic user info).
 * Uses: AuthService, LoginDto, Public decorator.
 * Used by: HTTP clients calling POST /auth/login.
 */
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user (patient, doctor, or admin)' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }
}
