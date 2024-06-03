import { Context, ContextService } from '@gedai/nestjs-core';
import { INestApplication, Logger } from '@nestjs/common';
import {
  WinstonModule,
  WinstonModuleOptions,
  utilities as nestWinstonUtils,
} from 'nest-winston';
import { config, format, transports } from 'winston';
import { MODULE_OPTIONS_TOKEN } from '../common-config.builder';
import { CommonConfigModuleOptions } from '../common-config.options';
import { configureOutboundHttpCorrelationPropagation } from './http-correlation.propagator';
import { configureMetadataInterceptor } from './metadata.interceptor';
import { Obfuscator, RegExpObfuscator } from './obfuscator';

let contextService: ContextService;
let anonymizer: Obfuscator;
let env: string;
let appName: string;

const { Console } = transports;
const { combine, timestamp, json } = format;
const { nestLike } = nestWinstonUtils.format;

const correlate = format((info) => {
  const context: Context = info.error?.context ?? contextService.getContext();
  const contextId = context.getId();
  const correlationId = context.getCorrelationId();
  return { ...info, contextId, correlationId };
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
    const obfuscated = anonymizer.obfuscate(info, [
      ...(extraSensitiveKeys ?? []),
      ...commonSensitiveKeys,
    ]);
    return obfuscated;
  })();

const metadata = () =>
  format((info) => {
    const meta =
      contextService.get<{ name: string; value: string }[]>(
        '__TracedMetadata__',
      ) ?? [];
    const values = meta.reduce(
      (acc, { name, value }) => ({ ...acc, [name]: value }),
      {},
    );
    return { ...info, appName, env, ...values };
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
    // KEEP STYLE
    timestamp(),
    metadata(),
    correlate(),
    treatError(),
    sensitive(),
    json(),
  );

const prettyFormat = () =>
  combine(
    timestamp(),
    metadata(),
    correlate(),
    treatError(),
    sensitive(),
    nestLike(appName),
  );

export const configureLogger = (app: INestApplication) => {
  const options = app.get<CommonConfigModuleOptions>(MODULE_OPTIONS_TOKEN);
  const {
    appName: _appName = 'unknown-app',
    environment = 'production',
    logger: loggerConfig = {},
  } = options;

  const {
    format = 'json',
    level = 'info',
    silent = false,
    obfuscation = {},
  } = loggerConfig;

  const {
    sensitiveKeys: anonymizeKeys = [],
    obfuscator: _anonymizer = new RegExpObfuscator(),
  } = obfuscation;

  contextService = app.get(ContextService);
  extraSensitiveKeys = anonymizeKeys;
  anonymizer = _anonymizer;
  const usePrettyFormat = format === 'pretty';

  env = environment;
  appName = _appName;
  const winstonConfig: WinstonModuleOptions = {
    silent,
    levels: config.npm.levels,
    level,
    format: usePrettyFormat ? prettyFormat() : jsonFormat(),
    transports: [new Console()],
  };
  const logger = WinstonModule.createLogger(winstonConfig);
  app.useLogger(logger);
  configureMetadataInterceptor(app);
  configureOutboundHttpCorrelationPropagation(app);
  Logger.log('Logger initialized', '@gedai/common/config');
  return app;
};
