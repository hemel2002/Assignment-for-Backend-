import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message: string | string[] = "An unexpected error occurred";
    let errors: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as any;
      message = body.message ?? exception.message;
      code = body.code ?? HttpStatus[status] ?? "REQUEST_ERROR";
      errors = body.errors;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002") {
        status = HttpStatus.CONFLICT;
        code = "UNIQUE_CONFLICT";
        message = `A record with this ${formatTarget(exception.meta?.target)} already exists`;
      } else if (exception.code === "P2003" || exception.code === "P2014") {
        status = HttpStatus.CONFLICT;
        code = "RELATION_CONFLICT";
        message = "This record is still referenced and cannot be changed";
      } else if (exception.code === "P2025") {
        status = HttpStatus.NOT_FOUND;
        code = "NOT_FOUND";
        message = "The requested record was not found";
      }
    }

    response.status(status).json({
      success: false,
      error: { code, message, ...(errors ? { errors } : {}) },
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }
}

function formatTarget(target: unknown) {
  return Array.isArray(target) ? target.join(", ") : "unique field";
}
