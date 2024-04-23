import {
  INestApplication,
  Logger,
  VersioningOptions,
  VersioningType,
} from '@nestjs/common';

export const configureVersioning =
  (options?: VersioningOptions) => (app: INestApplication) => {
    app.enableVersioning(options ?? { type: VersioningType.URI });
    Logger.log('API Versioning initialized', '@gedai/common/config');
    return app;
  };
