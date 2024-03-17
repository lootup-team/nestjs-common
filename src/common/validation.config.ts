import {
  INestApplication,
  Logger,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

export const configureValidation =
  (options?: ValidationPipeOptions) => (app: INestApplication) => {
    app.useGlobalPipes(
      new ValidationPipe(
        options ?? {
          whitelist: true,
          transform: true,
          transformOptions: { enableImplicitConversion: false },
        },
      ),
    );
    Logger.log('Validation initialized', 'Configuration');
    return app;
  };
