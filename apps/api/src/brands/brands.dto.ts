import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from "class-validator";
import { StatusPageQueryDto } from "../common/validation/query.dto";

export class BrandQueryDto extends StatusPageQueryDto {}

export class CreateBrandDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(140)
  slug!: string;

  @IsOptional()
  @IsUUID()
  logoId?: string;

  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateBrandDto extends CreateBrandDto {}
