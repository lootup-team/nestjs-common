import { Reflector } from '@nestjs/core';

import { ContextService } from '@gedai/nestjs-core';
import {
  CallHandler,
  ExecutionContext,
  INestApplication,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { TracedMetadata } from './traced-metadata.decorator';

@Injectable()
export class MetadataInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly context: ContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<any>) {
    const meta = this.reflector.get(TracedMetadata, context.getHandler());

    if (meta?.length) {
      this.context.set('__TracedMetadata__', meta);
    }

    return next.handle();
  }
}

export const configureMetadataInterceptor = (app: INestApplication) => {
  const context = app.get(ContextService);
  const reflector = app.get(Reflector);
  const interceptor = new MetadataInterceptor(reflector, context);
  app.useGlobalInterceptors(interceptor);

  Logger.log('Traced metadata interceptor initialized', '@gedai/common/config');
  return app;
};
