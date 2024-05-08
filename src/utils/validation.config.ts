import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from '../common-config.builder';
import { CommonConfigModuleOptions } from '../common-config.options';

export const configureValidation = (app: INestApplication) => {
  const options = app.get<CommonConfigModuleOptions>(MODULE_OPTIONS_TOKEN);

  app.useGlobalPipes(
    new ValidationPipe(
      options.validationPipe ?? {
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      },
    ),
  );
  Logger.log('Validation initialized', '@gedai/common/config');
  return app;
};
