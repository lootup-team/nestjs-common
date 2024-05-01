import { Context, ContextService } from '@gedai/nestjs-core';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WinstonModule,
  WinstonModuleOptions,
  utilities as nestWinstonUtils,
} from 'nest-winston';
import { config, format, transports } from 'winston';
import { Anonymizer, RegExpAnonymizer } from './anonymizer';

let contextService: ContextService;
let anonymizer: Anonymizer;
let env: string;
let serviceName: string;

const { Console } = transports;
const { combine, timestamp, json } = format;
const { nestLike } = nestWinstonUtils.format;

const contextify = format((info) => {
  const context: Context = info.error?.context ?? contextService.getContext();
  const contextId = context.getId();
  return { ...info, contextId };
});

const commonSensitiveKeys = [
  /authorization/i,
  /password/i,
  /access.*token/i,
  /client.*secret/i,
  /.*api.*key/i,
  /.*card.*number/i,
];

let extraSensitiveKeys: (string | RegExp)[];

const sensitive = () =>
  format((info) => {
    const anonymized = anonymizer.maskFields(info, [
      ...(extraSensitiveKeys ?? []),
      ...commonSensitiveKeys,
    ]);
    return anonymized;
  })();

const environment = () =>
  format((info) => {
    return { ...info, env };
  })();

const service = () =>
  format((info) => {
    return { ...info, service: serviceName };
  })();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const treatError = format(({ stack: _stack, error, ...info }) => {
  if (!error) {
    return info;
  }

  const { innerException } = error;
  const exception = innerException ? { innerException } : {};
  return {
    ...info,
    error: {
      message: error.message,
      stack: error.stack,
      ...exception,
    },
  };
});

const jsonFormat = () =>
  combine(
    timestamp(),
    environment(),
    service(),
    contextify(),
    treatError(),
    sensitive(),
    json(),
  );

const prettyFormat = () =>
  combine(
    timestamp(),
    environment(),
    service(),
    contextify(),
    treatError(),
    sensitive(),
    nestLike(serviceName),
  );

export type LoggerOptions = {
  silent?: boolean;
  anonymizer?: Anonymizer;
  anonymizeKeys?: (string | RegExp)[];
};

export const configureLogger =
  (options?: LoggerOptions) => (app: INestApplication) => {
    const {
      anonymizer: _anonymizer = new RegExpAnonymizer(),
      silent = false,
      anonymizeKeys,
    } = options || {};
    const configService = app.get(ConfigService);
    contextService = app.get(ContextService);
    extraSensitiveKeys = anonymizeKeys;
    anonymizer = _anonymizer;

    const _env = configService.get('NODE_ENV', 'production');
    const appName = configService.get('SERVICE_NAME', 'nest-app');
    const logLevel = configService.get('LOG_LEVEL', 'info');
    const logFormat = configService.get('LOG_FORMAT', 'json');
    const usePrettyFormat = logFormat === 'pretty';

    env = _env;
    serviceName = appName;
    const loggerConfig: WinstonModuleOptions = {
      silent,
      levels: config.npm.levels,
      level: logLevel,
      format: usePrettyFormat ? prettyFormat() : jsonFormat(),
      transports: [new Console()],
    };
    const logger = WinstonModule.createLogger(loggerConfig);
    app.useLogger(logger);
    Logger.log('Logger initialized', '@gedai/common/config');
    return app;
  };
