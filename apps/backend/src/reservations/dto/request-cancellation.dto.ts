import { IsString, MinLength, MaxLength } from 'class-validator';

export class RequestCancellationDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  message!: string;
}



