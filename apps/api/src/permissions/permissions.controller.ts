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
import { PageQueryDto } from "../common/validation/query.dto";
import {
  CreatePermissionGroupDto,
  UpdatePermissionGroupDto
} from "./permissions.dto";
import { PermissionsService } from "./permissions.service";

@Controller("permissions")
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  @RequirePermissions("permission:read")
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Get(":id")
  @RequirePermissions("permission:read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("permission:create")
  create(@Body() dto: CreatePermissionGroupDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("permission:update")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermissionGroupDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("permission:delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
