import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MediaType } from "@prisma/client";
import { mkdir, unlink, writeFile } from "fs/promises";
import { extname, join, resolve } from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { PrismaService } from "../prisma/prisma.service";
import { pageMeta } from "../common/validation/query.dto";
import { MediaQueryDto, UpdateMediaDto } from "./media.dto";

@Injectable()
export class MediaService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    this.uploadDir = resolve(config.get("UPLOAD_DIR", "../../uploads"));
  }

  async list(query: MediaQueryDto) {
    const where = {
      ...(query.search
        ? {
            OR: [
              {
                originalName: {
                  contains: query.search,
                  mode: "insensitive" as const
                }
              },
              {
                title: {
                  contains: query.search,
                  mode: "insensitive" as const
                }
              }
            ]
          }
        : {}),
      ...(query.type ? { type: query.type } : {})
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      this.prisma.media.count({ where })
    ]);
    return { items, meta: pageMeta(query.page, query.limit, total) };
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException("Media asset not found");
    return media;
  }

  async upload(files: Express.Multer.File[], uploadedById: string) {
    if (!files?.length) throw new BadRequestException("Select at least one file");
    await mkdir(this.uploadDir, { recursive: true });
    await mkdir(join(this.uploadDir, "thumbs"), { recursive: true });
    const created = [];

    for (const file of files) {
      const detected = detect(file.buffer);
      if (!detected) {
        throw new BadRequestException(
          `${file.originalname}: content is not an allowed JPEG, PNG, WebP or MP4 file`
        );
      }
      const fileName = `${randomUUID()}.${detected.extension}`;
      const storedPath = join(this.uploadDir, fileName);
      await writeFile(storedPath, file.buffer);

      let width: number | undefined;
      let height: number | undefined;
      let thumbnailPath: string | undefined;
      let thumbnailUrl: string | undefined;
      if (detected.type === MediaType.IMAGE) {
        const image = sharp(file.buffer);
        const metadata = await image.metadata();
        width = metadata.width;
        height = metadata.height;
        thumbnailPath = join(this.uploadDir, "thumbs", `${fileName}.webp`);
        await image
          .clone()
          .rotate()
          .resize(360, 360, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(thumbnailPath);
        thumbnailUrl = this.publicUrl(`/uploads/thumbs/${fileName}.webp`);
      }

      try {
        created.push(
          await this.prisma.media.create({
            data: {
              fileName,
              originalName: file.originalname,
              storedPath,
              publicUrl: this.publicUrl(`/uploads/${fileName}`),
              mimeType: detected.mime,
              type: detected.type,
              size: file.size,
              width,
              height,
              thumbnailPath,
              thumbnailUrl,
              title: file.originalname.replace(extname(file.originalname), ""),
              uploadedById
            }
          })
        );
      } catch (error) {
        await unlink(storedPath).catch(() => undefined);
        if (thumbnailPath) await unlink(thumbnailPath).catch(() => undefined);
        throw error;
      }
    }
    return created;
  }

  async update(id: string, dto: UpdateMediaDto) {
    await this.findOne(id);
    return this.prisma.media.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productMedia: true,
            variantMedia: true,
            categories: true,
            brands: true,
            attributeValues: true,
            userAvatars: true
          }
        }
      }
    });
    if (!media) throw new NotFoundException("Media asset not found");
    if (Object.values(media._count).some((count) => count > 0)) {
      throw new ConflictException(
        "Media is attached to another record and cannot be deleted"
      );
    }
    await this.prisma.media.delete({ where: { id } });
    await unlink(media.storedPath).catch(() => undefined);
    if (media.thumbnailPath) {
      await unlink(media.thumbnailPath).catch(() => undefined);
    }
    return { message: "Media record and stored files deleted" };
  }

  private publicUrl(path: string) {
    return `${this.config.get("PUBLIC_API_URL", "http://localhost:4000")}${path}`;
  }
}

function detect(buffer: Buffer): {
  mime: string;
  extension: string;
  type: MediaType;
} | null {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return { mime: "image/jpeg", extension: "jpg", type: MediaType.IMAGE };
  }
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: "image/png", extension: "png", type: MediaType.IMAGE };
  }
  if (
    buffer.subarray(0, 4).toString() === "RIFF" &&
    buffer.subarray(8, 12).toString() === "WEBP"
  ) {
    return { mime: "image/webp", extension: "webp", type: MediaType.IMAGE };
  }
  if (buffer.subarray(4, 8).toString() === "ftyp") {
    return { mime: "video/mp4", extension: "mp4", type: MediaType.VIDEO };
  }
  return null;
}
