import { PartialType } from '@nestjs/swagger';
import { CreateGiftProductDto } from './create-gift-product.dto';

export class UpdateGiftProductDto extends PartialType(CreateGiftProductDto) {}