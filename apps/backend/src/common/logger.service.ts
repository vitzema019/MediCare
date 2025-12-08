import { Injectable, LoggerService } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(private readonly logger: PinoLogger) {}

  private toLogObject(message: unknown, context?: string, extra: Record<string, unknown> = {}) {
    if (typeof message === 'object' && message !== null) {
      return { context, ...extra, payload: message };
    }

    return { context, ...extra, message };
  }

  log(message: unknown, context?: string) {
    this.logger.info(this.toLogObject(message, context));
  }

  error(message: unknown, trace?: string, context?: string) {
    this.logger.error(this.toLogObject(message, context, trace ? { trace } : {}));
  }

  warn(message: unknown, context?: string) {
    this.logger.warn(this.toLogObject(message, context));
  }

  debug?(message: unknown, context?: string) {
    this.logger.debug(this.toLogObject(message, context));
  }

  verbose?(message: unknown, context?: string) {
    this.logger.debug(this.toLogObject(message, context));
  }
}
