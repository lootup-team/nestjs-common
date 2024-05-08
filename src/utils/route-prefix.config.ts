import { INestApplication, Logger } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from '../common-config.builder';
import { CommonConfigModuleOptions } from '../common-config.options';

export const configureRoutePrefix = (app: INestApplication) => {
  const options = app.get<CommonConfigModuleOptions>(MODULE_OPTIONS_TOKEN);
  const prefix = (options.routePrefix ?? '').trim();

  if (prefix) {
    app.setGlobalPrefix(prefix);
    Logger.log('Route Prefixes Initialized', '@gedai/common/config');
  }
  return app;
};
