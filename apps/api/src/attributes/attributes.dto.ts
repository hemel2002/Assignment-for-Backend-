import { AttributeType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested
} from "class-validator";

export class AttributeValueDto {
  @IsString()
  @MaxLength(120)
  value!: string;

  @IsString()
  @MaxLength(140)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reference?: string;

  @IsOptional()
  @IsUUID()
  mediaId?: string;
}

export class CreateAttributeDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(140)
  slug!: string;

  @IsEnum(AttributeType)
  type!: AttributeType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
  values!: AttributeValueDto[];
}

export class UpdateAttributeDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(140)
  slug!: string;

  @IsEnum(AttributeType)
  type!: AttributeType;
}

export class UpdateAttributeValueDto extends AttributeValueDto {}
