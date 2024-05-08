import { ValidationPipeOptions, VersioningOptions } from '@nestjs/common';
import {
  CorsOptions,
  CorsOptionsDelegate,
} from '@nestjs/common/interfaces/external/cors-options.interface';
import * as compression from 'compression';
import { HelmetOptions } from 'helmet';
import { Obfuscator } from './logger/obfuscator';

export type ObfuscationOptions = {
  obfuscator?: Obfuscator;
  sensitiveKeys?: (string | RegExp)[];
};

export type LoggerOptions = {
  silent?: boolean;
  level?: 'debug' | 'verbose' | 'info' | 'warn' | 'error';
  format?: 'json' | 'pretty';
  obfuscation?: ObfuscationOptions;
};

export type HttpTrafficInspectionOptions = {
  mode?: 'none' | 'all' | 'inbound' | 'outbound';
  ignoreRoutes?: string[];
};

export type CORSOptions = CorsOptions | CorsOptionsDelegate<any>;

export type CompressionOptions = compression.CompressionOptions;

export type CommonConfigModuleOptions = {
  appName?: string;
  environment?: string;
  httpTrafficInspection?: HttpTrafficInspectionOptions;
  logger?: LoggerOptions;
  cors?: CORSOptions;
  helmet?: Readonly<HelmetOptions>;
  compression?: CompressionOptions;
  validationPipe?: ValidationPipeOptions;
  versioning?: VersioningOptions;
  routePrefix?: string;
};

export interface CommonConfigOptionsFactory {
  createOptions():
    | CommonConfigModuleOptions
    | Promise<CommonConfigModuleOptions>;
}
