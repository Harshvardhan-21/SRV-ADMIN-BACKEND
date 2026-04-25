import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums';

export class TransferPointsDto {
  @ApiProperty()
  @IsString()
  fromUserId: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  fromUserRole: UserRole;

  @ApiProperty()
  @IsString()
  toUserId: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  toUserRole: UserRole;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}