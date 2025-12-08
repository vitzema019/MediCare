import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdateTeamDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  scope?: string;

  @IsArray()
  @IsOptional()
  doctorIds?: string[];

  @IsString()
  @IsOptional()
  color?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

