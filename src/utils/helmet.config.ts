import { INestApplication, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { MODULE_OPTIONS_TOKEN } from '../common.builder';
import { CommonModuleOptions } from '../common.options';

export const configureHelmet = (app: INestApplication) => {
  const options = app.get<CommonModuleOptions>(MODULE_OPTIONS_TOKEN);

  app.use(helmet(options.helmet));
  Logger.log('Server security initialized', '@gedai/common/config');
  return app;
};
