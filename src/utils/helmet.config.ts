import { INestApplication, Logger } from '@nestjs/common';
import helmet, { HelmetOptions } from 'helmet';

export const configureHelmet =
  (options?: Readonly<HelmetOptions>) => (app: INestApplication) => {
    app.use(helmet(options));
    Logger.log('Server security initialized', '@gedai/common/config');
    return app;
  };
