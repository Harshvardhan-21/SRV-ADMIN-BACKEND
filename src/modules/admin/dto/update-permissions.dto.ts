import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ModulePermissionDto {
  @ApiProperty()
  @IsString()
  module: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  canView?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  canCreate?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  canExport?: boolean;
}

export class UpdatePermissionsDto {
  @ApiProperty({ type: [ModulePermissionDto] })
  permissions: ModulePermissionDto[];
}
