import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req
} from "@nestjs/common";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { CreateUserDto, UpdateUserDto, UserQueryDto } from "./users.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @RequirePermissions("user:read")
  list(@Query() query: UserQueryDto) {
    return this.service.list(query);
  }

  @Get(":id")
  @RequirePermissions("user:read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("user:create")
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("user:update")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() request: any
  ) {
    return this.service.update(id, request.user.id, dto);
  }

  @Delete(":id")
  @RequirePermissions("user:delete")
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() request: any
  ) {
    return this.service.remove(id, request.user.id);
  }
}
