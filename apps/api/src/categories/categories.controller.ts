import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post
} from "@nestjs/common";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import {
  CreateCategoryDto,
  UpdateCategoryDto
} from "./categories.dto";
import { CategoriesService } from "./categories.service";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @RequirePermissions("category:read")
  list() {
    return this.service.tree();
  }

  @Get("tree")
  @RequirePermissions("category:read")
  tree() {
    return this.service.tree();
  }

  @Get(":id")
  @RequirePermissions("category:read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("category:create")
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("category:update")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("category:delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
