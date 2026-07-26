import { MediaType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { PageQueryDto } from "../common/validation/query.dto";

export class MediaQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;
}

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
