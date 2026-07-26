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
import { StatusPageQueryDto } from "../common/validation/query.dto";
import { CreateRoleDto, UpdateRoleDto } from "./roles.dto";
import { RolesService } from "./roles.service";

@Controller("roles")
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @RequirePermissions("role:read")
  list(@Query() query: StatusPageQueryDto) {
    return this.service.list(query);
  }

  @Get("options")
  @RequirePermissions("user:create")
  options() {
    return this.service.options();
  }

  @Get(":id")
  @RequirePermissions("role:read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("role:create")
  create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("role:update")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("role:delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
