## Description

Winston and Nest-Winston opionated configuration for NestJS. This package depends on @gedai/core and @nestjs/config, be sure to install and setup those for everything to work as expected.

This package uses the following environment variables during its setup:

```
NODE_ENV="{development,testing,staging,production}"
APP_NAME="myApp"
LOG_LEVEL="{debug,info,warn,error}"
```

- development and testing will output colorized format
- staging and production will output json format

## Installation

```bash
$ npm install @gedai/core @gedai/logger @nestjs/config
```

## Running the app

### Step 1:

Apply global wide configuration in main.ts

```typescript
// app.module.ts
import { configureLogger } from '@gedai/logger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureLogger(app);
  await app.listen(3000);
}
bootstrap();
```

## Step 2:

You can now use the Nest's default logger with preconfigured setup.

```typescript
// app.service.ts
import { ContextService } from '@gedai/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private logger = new Logger(this.constructor.name);

  constructor(private readonly context: ContextService) {}

  getHello(): string {
    const message = 'Hello, World!';
    this.logger.log(message);
    // outputs: [nest-app] Info 3/16/2024, 3:16:59 PM [AppService] Hello, World! - {"traceId":"20889865-510c-433c-ac0a-a04f27b89d35"}
    /* Optionally:
     *  this.logger.log({ message, ...additionalDataForLogs });
     */
    return message;
  }
}
```

## License

Gedai is [MIT licensed](LICENSE).
