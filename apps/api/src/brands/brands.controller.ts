import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { BrandQueryDto, CreateBrandDto, UpdateBrandDto } from "./brands.dto";
import { BrandsService } from "./brands.service";

@Controller("brands")
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

  @Get()
  @RequirePermissions("brand:read")
  list(@Query() query: BrandQueryDto) {
    return this.service.list(query);
  }

  @Get(":id")
  @RequirePermissions("brand:read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("brand:create")
  create(@Body() dto: CreateBrandDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("brand:update")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("brand:delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
