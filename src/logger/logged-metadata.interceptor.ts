import { Reflector } from '@nestjs/core';

import { ContextService } from '@lootupteam/nestjs-core';
import {
  CallHandler,
  ExecutionContext,
  INestApplication,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { LoggedMetadata } from './logged-metadata.decorator';

@Injectable()
export class LoggedMetadataInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly context: ContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<any>) {
    const meta = this.reflector.get(LoggedMetadata, context.getHandler());

    if (meta?.length) {
      this.context.set('__LoggedMetadata__', meta);
    }

    return next.handle();
  }
}

export const configureMetadataInterceptor = (app: INestApplication) => {
  const context = app.get(ContextService);
  const reflector = app.get(Reflector);
  const interceptor = new LoggedMetadataInterceptor(reflector, context);
  app.useGlobalInterceptors(interceptor);

  Logger.log('Logged metadata interceptor initialized', '@gedai/common/config');
  return app;
};
