## Description

This package serves as a fundamental configuration utility for NestJS services, providing essential settings and dependencies to streamline development processes. It relies on `@gedai/nestjs-core` as a key dependency for keeping track of contexts. To ensure smooth operation, it's imperative to install and configure this dependency to ensure smooth operation.

## Getting Started

### Step 1: Installation

Install the necessary packages with your favorite Package Manager.

```bash
$ npm install @gedai/nestjs-core
```

### Step 2: Configuration Setup

In your `app.module.ts` file, import the required modules and configure them:

```typescript
// app.module.ts
import { CommonConfigModule } from '@gedai/nestjs-common';
import { ContextModule } from '@gedai/nestjs-core';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Set up Context Module
    ContextModule.forRoot({}),
    // Set up Common Module to provide configuration
    CommonConfigModule.forRoot({
      appName: 'gedai-app',
      environment: 'development',
      logger: {
        level: 'debug',
        format: 'pretty',
        obfuscation: { sensitiveKeys: ['cardnumber'] },
      },
      httpTrafficInspection: {
        ignoreRoutes: ['/v1/hidden-paths/*', '/v1/health'],
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Step 3: Application Wide Configuration

In your `main.ts` file, configure the application with the unified configuration handler:

```typescript
// main.ts using the unified handler
import { createNestApp } from '@gedai/nestjs-common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await createNestApp(AppModule);
  await app.listen(3000);
}
bootstrap();
```

Or, if you prefer, manually setting various common settings:

```typescript
// main.ts manually
import { configureContextWrappers } from '@gedai/nestjs-core';
import {
  configureCORS,
  configureCompression,
  configureExceptionHandler,
  configureHelmet,
  configureHttpInspectorInbound,
  configureHttpInspectorOutbound,
  configureLogger,
  configureRoutePrefix,
  configureValidation,
  configureVersioning,
} from '@gedai/nestjs-common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
    // Configure Context Wrappers
    .then(configureContextWrappers)
    // Configure Logger
    .then(configureLogger)
    // Configure Exception Handler
    .then(configureExceptionHandler)
    // Configure Traffic Inspection
    .then(configureHttpInspectorInbound)
    .then(configureHttpInspectorOutbound)
    // Other Common Configuration
    .then(configureCORS)
    .then(configureHelmet)
    .then(configureCompression)
    .then(configureValidation)
    .then(configureVersioning)
    .then(configureRoutePrefix);

  await app.listen(3000);
}
bootstrap();
```

### Step 4: Integration and Usage

With the setup complete, utilize Nest's default logger anywhere in your application.

```typescript
// app.service.ts
import { ContextService } from '@gedai/nestjs-core';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private logger = new Logger(this.constructor.name);

  getHello(): string {
    this.logger.log('Hello, Jack!');
    return 'Hello, Jack!';
  }
}
```

## Logger Interface and Error Handling

The logger is configured to seamlessly detect and parse error objects, simplifying the process of handling exceptions within your codebase. When an exception occurs and you need to manage it manually, you can effortlessly pass the error object down to the logger for efficient tracking and debugging. Additionally, the logger gracefully handles `unhandled exceptions`, ensuring comprehensive error monitoring throughout your application.

```typescript
try {
  throw new Error('Too Bad 💣');
}
catch(error) {
  this.logger.error({ message: 'Something bad happend here!', error: });
}
```

# Extra Configuration

Settings can be configured by passing configuration objects to `CommonConfigModule`

## Obfuscating Logs

This library comes equipped with a built-in `obfuscator` designed to obfuscate any sensitive keys detected in logs automatically. Should you require additional keys to be obfuscated, or if you prefer to implement a custom `obfuscator`, you can easily extend the functionality by providing your own `obfuscator` or keys to the `CommonConfigModule`.

By leveraging this feature, you can safeguard sensitive information within your logs, ensuring compliance with privacy regulations and bolstering the security of your application's logging system.

## Ignoring Routes from Inspection

Configuring specific routes to be excluded from inspection is particularly useful for health checks or heavy endpoints. Wildcards are supported in the configurations, allowing for flexible route matching.

### Wildcard usage:

- `*` matches any number of tokens in the `request.path`

### Examples:

- `/v1/accounts/\*/holder`
- - Hides routes like /v1/accounts/:id/holder from inspection.
- `/v1/accounts/\*`
- - Conceals nested routes within /v1/accounts from inspection.

## Available Features

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
- Traced Metadata in logs

## License

Gedai is [MIT licensed](LICENSE).
