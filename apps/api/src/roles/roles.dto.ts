import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from "class-validator";

export class CreateRoleDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsBoolean()
  grantAll?: boolean;

  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  permissionIds!: string[];
}

export class UpdateRoleDto extends CreateRoleDto {}
