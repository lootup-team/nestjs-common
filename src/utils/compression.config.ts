import { INestApplication, Logger } from '@nestjs/common';
import * as compression from 'compression';
import { MODULE_OPTIONS_TOKEN } from '../common-config.builder';
import { CommonConfigModuleOptions } from '../common-config.options';

export const configureCompression = (app: INestApplication) => {
  const options = app.get<CommonConfigModuleOptions>(MODULE_OPTIONS_TOKEN);
  app.use(compression(options.compression));
  Logger.log('Compression initialized', '@lootupteam/nestjs-common');
  return app;
};
