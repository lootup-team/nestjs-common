import { INestApplication, Logger } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from '../common.builder';
import { CommonModuleOptions } from '../common.options';

export const configureCORS = (app: INestApplication) => {
  const options = app.get<CommonModuleOptions>(MODULE_OPTIONS_TOKEN);
  app.enableCors(options.cors);
  Logger.log('CORS initialized', '@gedai/common/config');
  return app;
};
