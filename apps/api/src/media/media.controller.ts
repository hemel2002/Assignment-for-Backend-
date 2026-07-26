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
  Req,
  UploadedFiles,
  UseInterceptors
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { MediaQueryDto, UpdateMediaDto } from "./media.dto";
import { MediaService } from "./media.service";

@Controller("media")
export class MediaController {
  constructor(
    private readonly service: MediaService,
    private readonly config: ConfigService
  ) {}

  @Get()
  @RequirePermissions("media:read")
  list(@Query() query: MediaQueryDto) {
    return this.service.list(query);
  }

  @Get(":id")
  @RequirePermissions("media:read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post("upload")
  @RequirePermissions("media:upload")
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES ?? 5_242_880) }
    })
  )
  upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() request: any
  ) {
    return this.service.upload(files, request.user.id);
  }

  @Patch(":id")
  @RequirePermissions("media:write")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateMediaDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("media:delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
