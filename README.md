## Description

Opionated common configuration for NestJS services. This package depends on @gedai/nestjs-core and @nestjs/config. Be sure to install and setup those for everything to work as expected.

## Configuration:

This package uses a few environment variables for configuration. The folowing lists the available values for each configuration variable.

```
NODE_ENV="{development,testing,staging,production}"
SERVICE_NAME="myApp"
LOG_LEVEL="{debug,info,warn,error}"
LOG_FORMAT="{pretty,json}"
INSPECT_HTTP_TRAFFIC="{all,none,inbound,outbound}"
```

- development and testing will output colorized format
- staging and production will output json format

## Getting Started

### Step 1: Installation

```bash
$ npm install @gedai/nestjs-core @gedai/common @nestjs/config
```

### Step 2: The Setup

Import the required modules

```typescript
// app.module.ts
import { ContextModule } from '@gedai/nestjs-core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // <<-- Setup Config Module Here -->>
    ConfigModule.forRoot({ isGlobal: true }),
    // <<-- Setup Context Module Here -->>
    ContextModule.forRoot({}),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Apply global wide configuration in main.ts

```typescript
// app.module.ts
import { configureContextWrappers } from '@gedai/nestjs-core';
import { configureLogger } from '@gedai/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
    // <<-- Setup Context Wrappers Here -->>
    .then(configureContextWrappers())
    // <<-- Setup Logger Here -->>
    .then(configureLogger());
  await app.listen(3000);
}
bootstrap();
```

### Step 3: Do Magic!

You can now use the Nest's default logger with preconfigured setup.

```typescript
// app.service.ts
import { ContextService } from '@gedai/nestjs-core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // <<-- Create a scoped instance of nest's Logger -->>
  private logger = new Logger(this.constructor.name);

  constructor(private readonly context: ContextService) {}

  getHello(): string {
    // <<-- Whenever you use the logger, it will be tracked with the contextId-->>
    this.logger.log('Hello, Jack!');
    return message;
  }
}
```

## Features

- Logging
- Anonymized keys on logged objects
- Inbound HTTP traffic inspection
- Outbound HTTP traffic inspection
- Compression
- Helmet
- Validation
- CORS
- API Versioning
- Route Prefixing

## License

Gedai is [MIT licensed](LICENSE).
