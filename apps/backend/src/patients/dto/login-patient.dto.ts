import { IsEmail, IsString } from 'class-validator';

export class LoginPatientDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}



