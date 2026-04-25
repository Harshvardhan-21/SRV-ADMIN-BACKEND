import { IsString, IsNotEmpty, Length } from 'class-validator';

export class MobileLoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  phone: string;

  @IsString()
  @IsNotEmpty()
  role: 'electrician' | 'dealer';
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  role: 'electrician' | 'dealer';

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class MobileRefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
