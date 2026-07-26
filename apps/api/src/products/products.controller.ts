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
import { ProductQueryDto, UpsertProductDto } from "./products.dto";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @RequirePermissions("product:read")
  list(@Query() query: ProductQueryDto) {
    return this.service.list(query);
  }

  @Get(":id")
  @RequirePermissions("product:read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("product:create")
  create(@Body() dto: UpsertProductDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("product:update")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpsertProductDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("product:delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
