import { MediaType } from "@prisma/client";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import {
  BadRequestError,
  ConflictError,
  NotFoundError
} from "../common/errors/http-error";
import { PrismaService } from "../prisma/prisma.service";
import { pageMeta } from "../common/validation/query.dto";
import { MediaQueryDto, UpdateMediaDto } from "./media.dto";

export class MediaService {
  private readonly cloud: typeof cloudinary;

  constructor(private readonly prisma: PrismaService) {
    this.cloud = cloudinary;
    this.cloud.config({
      cloud_name: requiredEnv("CLOUDINARY_CLOUD_NAME"),
      api_key: requiredEnv("CLOUDINARY_API_KEY"),
      api_secret: requiredEnv("CLOUDINARY_API_SECRET"),
      secure: true
    });
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
    if (!media) throw new NotFoundError("Media asset not found");
    return media;
  }

  async upload(files: Express.Multer.File[], uploadedById: string) {
    if (!files?.length) throw new BadRequestError("Select at least one file");
    const created = [];

    for (const file of files) {
      const detected = detect(file.buffer);
      if (!detected) {
        throw new BadRequestError(
          `${file.originalname}: content is not an allowed JPEG, PNG, WebP or MP4 file`
        );
      }
      const asset = await this.uploadBuffer(
        file.buffer,
        detected.type === MediaType.IMAGE ? "image" : "video"
      );
      const thumbnailUrl =
        detected.type === MediaType.IMAGE
          ? this.cloud.url(asset.public_id, {
              secure: true,
              transformation: [
                { width: 360, height: 360, crop: "limit" },
                { fetch_format: "webp", quality: "auto" }
              ]
            })
          : undefined;

      try {
        created.push(
          await this.prisma.media.create({
            data: {
              fileName: asset.public_id,
              originalName: file.originalname,
              storedPath: cloudinaryPath(asset.public_id),
              publicUrl: asset.secure_url,
              mimeType: detected.mime,
              type: detected.type,
              size: asset.bytes ?? file.size,
              width: asset.width,
              height: asset.height,
              thumbnailPath: thumbnailUrl ? cloudinaryPath(asset.public_id) : undefined,
              thumbnailUrl,
              title: file.originalname.replace(/\.[^.]+$/, ""),
              uploadedById
            }
          })
        );
      } catch (error) {
        await this.destroyAsset(asset.public_id, detected.type).catch(() => undefined);
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
    if (!media) throw new NotFoundError("Media asset not found");
    if (Object.values(media._count).some((count) => count > 0)) {
      throw new ConflictError(
        "Media is attached to another record and cannot be deleted"
      );
    }
    await this.prisma.media.delete({ where: { id } });
    const publicId = readCloudinaryPath(media.storedPath);
    if (publicId) await this.destroyAsset(publicId, media.type).catch(() => undefined);
    return { message: "Media record and Cloudinary asset deleted" };
  }

  private uploadBuffer(
    buffer: Buffer,
    resourceType: "image" | "video"
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = this.cloud.uploader.upload_stream(
        {
          folder: "trends-bird",
          resource_type: resourceType,
          overwrite: false
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
          resolve(result);
        }
      );
      stream.end(buffer);
    });
  }

  private async destroyAsset(publicId: string, type: MediaType) {
    await this.cloud.uploader.destroy(publicId, {
      resource_type: type === MediaType.IMAGE ? "image" : "video",
      invalidate: true
    });
  }
}

const CLOUDINARY_PATH_PREFIX = "cloudinary://";
const cloudinaryPath = (publicId: string) => `${CLOUDINARY_PATH_PREFIX}${publicId}`;
const readCloudinaryPath = (storedPath: string) =>
  storedPath.startsWith(CLOUDINARY_PATH_PREFIX)
    ? storedPath.slice(CLOUDINARY_PATH_PREFIX.length)
    : undefined;

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

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
