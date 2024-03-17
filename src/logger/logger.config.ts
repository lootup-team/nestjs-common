import { ContextService } from '@gedai/core';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WinstonModule,
  WinstonModuleOptions,
  utilities as nestWinstonUtils,
} from 'nest-winston';
import { config, format, transports } from 'winston';
import { Anonymizer } from './anonymizer';
import { SimpleAnonymizer } from './simple-anonymizer';

let contextService: ContextService;

const { Console } = transports;
const { combine, timestamp, json } = format;
const { nestLike } = nestWinstonUtils.format;

const trace = format((info) => {
  const errorContext: Map<string, any> = info.error?.context;
  const traceId = errorContext?.get('traceId') ?? contextService.get('traceId');
  errorContext?.clear();
  return { ...info, traceId };
});

const sensitive = (anonymizer: Anonymizer) =>
  format((info) => {
    const anonymized = anonymizer.maskFields(info, [
      'authorization',
      'password',
      /access.*token/i,
      /client.*secret/i,
      /.*api.*key/i,
    ]);
    return anonymized;
  })();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const treatError = format(({ stack: _stack, ...info }) => {
  if (!info.error) {
    return info;
  }

  const { error } = info;
  const res = error.response;

  const response = res
    ? { response: { status: res.status, data: res.data } }
    : {};

  return {
    ...info,
    error: { message: error.message, stack: error.stack, ...response },
  };
});

const remoteFormat = (anonymizer: Anonymizer) =>
  combine(timestamp(), trace(), treatError(), sensitive(anonymizer), json());

const localFormat = (appName: string, anonymizer: Anonymizer) =>
  combine(
    timestamp(),
    trace(),
    treatError(),
    sensitive(anonymizer),
    nestLike(appName),
  );

export type LoggerOptions = {
  silent?: boolean;
  anonymizer?: Anonymizer;
};

export const configureLogger =
  (options?: LoggerOptions) => (app: INestApplication) => {
    const { anonymizer = new SimpleAnonymizer(), silent = false } =
      options || {};
    const configService = app.get(ConfigService);
    contextService = app.get(ContextService);

    const [env, appName, logLevel] = [
      configService.get('NODE_ENV', 'production'),
      configService.get('APP_NAME', 'nest-app'),
      configService.get('LOG_LEVEL', 'info'),
    ];
    const useLocalFormat = ['development', 'testing'].includes(env);
    const loggerConfig: WinstonModuleOptions = {
      silent,
      levels: config.npm.levels,
      level: logLevel,
      format: useLocalFormat
        ? localFormat(appName, anonymizer)
        : remoteFormat(anonymizer),
      transports: [new Console()],
    };
    const logger = WinstonModule.createLogger(loggerConfig);
    app.useLogger(logger);
    Logger.log('Logger initialized', '@gedai/logger');
    return app;
  };
