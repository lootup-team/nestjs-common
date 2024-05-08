import { INestApplication, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { MODULE_OPTIONS_TOKEN } from '../common-config.builder';
import { CommonConfigModuleOptions } from '../common-config.options';

export const configureHelmet = (app: INestApplication) => {
  const options = app.get<CommonConfigModuleOptions>(MODULE_OPTIONS_TOKEN);

  app.use(helmet(options.helmet));
  Logger.log('Server security initialized', '@gedai/common/config');
  return app;
};
