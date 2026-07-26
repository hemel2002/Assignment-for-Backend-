import { Transform, Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested
} from "class-validator";
import { PageQueryDto } from "../common/validation/query.dto";

export class ProductQueryDto extends PageQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value
  )
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsIn(["name", "createdAt", "price", "stock", "sortOrder"])
  sortBy = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "desc";
}

export class ProductMediaDto {
  @IsUUID()
  mediaId!: string;

  @IsBoolean()
  isThumbnail!: boolean;

  @IsBoolean()
  isGallery!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class VariantMediaDto {
  @IsUUID()
  mediaId!: string;

  @IsBoolean()
  isThumbnail!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ProductVariantDto {
  @IsString()
  @MaxLength(100)
  sku!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  weight?: number;

  @IsBoolean()
  active!: boolean;

  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  attributeValueIds!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantMediaDto)
  media!: VariantMediaDto[];
}

export class UpsertProductDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(220)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  longDescription?: string;

  @IsBoolean()
  hasVariants!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  weight?: number;

  @IsBoolean()
  active!: boolean;

  @IsBoolean()
  featured!: boolean;

  @Type(() => Number)
  @IsInt()
  sortOrder!: number;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  categoryIds!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductMediaDto)
  media!: ProductMediaDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants!: ProductVariantDto[];
}
