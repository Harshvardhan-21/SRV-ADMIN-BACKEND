import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PointsConfigDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  basePoints: number;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonusPoints?: number;
}