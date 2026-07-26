import { ArrayNotEmpty, IsArray, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class CreatePermissionGroupDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @ArrayNotEmpty()
  @Matches(/^[a-z][a-z0-9_-]*$/, { each: true })
  actions!: string[];
}

export class UpdatePermissionGroupDto extends CreatePermissionGroupDto {}
