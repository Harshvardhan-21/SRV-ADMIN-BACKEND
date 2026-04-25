import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OfferStatus } from '../../../common/enums';

export class CreateOfferDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  discount?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  validFrom?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  validTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiProperty({ enum: OfferStatus, default: 'active' })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productCategory?: string;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  bonusPoints?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxUsage?: number;
}