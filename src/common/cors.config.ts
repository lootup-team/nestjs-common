import { INestApplication, Logger } from '@nestjs/common';
import {
  CorsOptions,
  CorsOptionsDelegate,
} from '@nestjs/common/interfaces/external/cors-options.interface';

export const configureCORS =
  (options?: CorsOptions | CorsOptionsDelegate<any>) =>
  (app: INestApplication) => {
    app.enableCors(options);
    Logger.log('CORS initialized', 'Configuration');
    return app;
  };
