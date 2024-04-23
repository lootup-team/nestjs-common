import { INestApplication, Logger } from '@nestjs/common';
import * as compression from 'compression';

export const configureCompression =
  (options?: compression.CompressionOptions) => (app: INestApplication) => {
    app.use(compression(options));
    Logger.log('Compression initialized', '@gedai/common/config');
    return app;
  };
