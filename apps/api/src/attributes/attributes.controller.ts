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
  AttributeValueDto,
  CreateAttributeDto,
  UpdateAttributeDto,
  UpdateAttributeValueDto
} from "./attributes.dto";
import { AttributesService } from "./attributes.service";

@Controller("attributes")
export class AttributesController {
  constructor(private readonly service: AttributesService) {}

  @Get()
  @RequirePermissions("attribute:read")
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Get(":id")
  @RequirePermissions("attribute:read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("attribute:create")
  create(@Body() dto: CreateAttributeDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("attribute:update")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttributeDto
  ) {
    return this.service.update(id, dto);
  }

  @Post(":id/values")
  @RequirePermissions("attribute:update")
  addValue(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AttributeValueDto
  ) {
    return this.service.addValue(id, dto);
  }

  @Patch(":id/values/:valueId")
  @RequirePermissions("attribute:update")
  updateValue(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("valueId", ParseUUIDPipe) valueId: string,
    @Body() dto: UpdateAttributeValueDto
  ) {
    return this.service.updateValue(id, valueId, dto);
  }

  @Delete(":id/values/:valueId")
  @RequirePermissions("attribute:delete")
  removeValue(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("valueId", ParseUUIDPipe) valueId: string
  ) {
    return this.service.removeValue(id, valueId);
  }

  @Delete(":id")
  @RequirePermissions("attribute:delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
