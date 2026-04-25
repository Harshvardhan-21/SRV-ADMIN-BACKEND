import { PartialType } from '@nestjs/swagger';
import { CreateElectricianDto } from './create-electrician.dto';

export class UpdateElectricianDto extends PartialType(CreateElectricianDto) {}