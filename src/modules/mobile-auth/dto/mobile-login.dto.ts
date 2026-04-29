import { IsString, IsNotEmpty, Length } from 'class-validator';
import { IsEmail, IsIn, IsOptional } from 'class-validator';

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

export class MobilePasswordLoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  phone: string;

  @IsString()
  @IsNotEmpty()
  role: 'electrician' | 'dealer';

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SendSignupOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  phone: string;

  @IsString()
  @IsNotEmpty()
  role: 'electrician' | 'dealer';
}

export class VerifySignupOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  phone: string;

  @IsString()
  @IsNotEmpty()
  role: 'electrician' | 'dealer';

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class RegisterDealerDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  phone: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  town: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class RegisterElectricianDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  phone: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  @IsNotEmpty()
  dealerPhone: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'General Electrician',
    'Industrial Electrician',
    'Residential Wiring',
    'Solar Installer',
    'AC/Appliance Technician',
    'Panel Board Specialist',
    'Lighting Specialist',
    'Contractor',
  ])
  subCategory?: string;
}
