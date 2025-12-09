import { IsEmail, IsString } from 'class-validator';

export class LoginDoctorDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}



