import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name!: string;

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

