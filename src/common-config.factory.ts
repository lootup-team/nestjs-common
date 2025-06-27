import { configureContextWrappers } from '@lootupteam/nestjs-core';
import { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { configureExceptionHandler } from './logger/exception.handler';
import { configureHttpInspectorInbound } from './logger/http-inspector-inbound.middleware';
import { configureHttpInspectorOutbound } from './logger/http-inspector-outbound.interceptor';
import { configureLogger } from './logger/logger.config';
import { configureCompression } from './utils/compression.config';
import { configureCORS } from './utils/cors.config';
import { configureHelmet } from './utils/helmet.config';
import { configureRoutePrefix } from './utils/route-prefix.config';
import { configureValidation } from './utils/validation.config';
import { configureVersioning } from './utils/versioning.config';

export const createNestApp = async (
  appModule: any,
  opts?: NestApplicationOptions,
) => {
  const { bufferLogs = true } = opts ?? {};
  const app = await NestFactory.create(appModule, { ...opts, bufferLogs })
    // :: keep layout
    .then(configureContextWrappers)
    .then(configureLogger)
    .then(configureExceptionHandler)
    .then(configureHttpInspectorInbound)
    .then(configureHttpInspectorOutbound)
    .then(configureCORS)
    .then(configureHelmet)
    .then(configureCompression)
    .then(configureValidation)
    .then(configureVersioning)
    .then(configureRoutePrefix);

  return app;
};
