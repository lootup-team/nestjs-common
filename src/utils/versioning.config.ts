import { INestApplication, Logger, VersioningType } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from '../common-config.builder';
import { CommonConfigModuleOptions } from '../common-config.options';

export const configureVersioning = (app: INestApplication) => {
  const options = app.get<CommonConfigModuleOptions>(MODULE_OPTIONS_TOKEN);

  app.enableVersioning(options.versioning ?? { type: VersioningType.URI });
  Logger.log('API Versioning initialized', '@gedai/common/config');
  return app;
};
