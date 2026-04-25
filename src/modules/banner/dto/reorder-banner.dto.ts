import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BannerOrderItem {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsNumber()
  order: number;
}

export class ReorderBannerDto {
  @ApiProperty({ type: [BannerOrderItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BannerOrderItem)
  items: BannerOrderItem[];
}
