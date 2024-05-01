## Description

This package serves as a fundamental configuration utility for NestJS services, providing essential settings and dependencies to streamline development processes. It relies on two key dependencies: @gedai/nestjs-core and @nestjs/config. To ensure smooth operation, it's imperative to install and configure these dependencies alongside this package.

## Configuration Variables and Values:

This package utilizes several environment variables for configuration purposes. Below is a list of available configuration variables along with their respective acceptable values:

- `NODE_ENV`: Specifies the environment mode and can be set to one of the following: `development`, `testing`, `staging`, `production`.
- `SERVICE_NAME`: Defines the name of the service, typically used for identification purposes.
- `LOG_LEVEL`: Sets the logging level and can be assigned one of the following values: `debug`, `verbose`,`info`, `warn`, `error`.
- `LOG_FORMAT`: Specifies the format of the logs and supports either `pretty` or `json` formats.
- `INSPECT_HTTP_TRAFFIC`: Determines the HTTP traffic inspection mode and supports the values `all`, `none`, `inbound`, or `outbound`.

## Getting Started

### Step 1: Installation

Install the necessary packages with your favorite Package Manager.

```bash
$ npm install @gedai/nestjs-core @nestjs/config
```

### Step 2: Configuration Setup

In your `app.module.ts` file, import the required modules and configure them:

```typescript
// app.module.ts
import { ContextModule } from '@gedai/nestjs-core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Set up Config Module
    ConfigModule.forRoot({ isGlobal: true }),
    // Set up Context Module
    ContextModule.forRoot({}),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Step 3: Application Wide Configuration

In your `main.ts` file, configure the application with various common settings:

```typescript
// main.ts
import { configureContextWrappers } from '@gedai/nestjs-core';
import {
  configureCORS,
  configureCompression,
  configureExceptionLogger,
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
  const app = await NestFactory.create(AppModule)
    // Configure Context Wrappers
    .then(configureContextWrappers())
    // Configure Logger
    .then(configureLogger())
    // Configure Exception Log Handler
    .then(configureExceptionLogger())
    // Configure Traffic Inspection
    .then(
      configureHttpInspectorInbound({
        ignoreRoutes: ['/v1/hidden-paths/*', '/v1/health'],
      }),
    )
    .then(configureHttpInspectorOutbound())
    // Other Common Configuration
    .then(configureCORS())
    .then(configureHelmet())
    .then(configureCompression())
    .then(configureValidation())
    .then(configureVersioning())
    .then(configureRoutePrefix());

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

  constructor(private readonly context: ContextService) {}

  getHello(): string {
    this.logger.log('Hello, Jack!');
    return 'Hello, Jack!';
  }
}
```

## Logger Interface and Error Handling

The logger is configured to seamlessly detect and parse error objects, simplifying the process of handling exceptions within your codebase. When an exception occurs and you need to manage it manually, you can effortlessly pass the error object down to the logger for efficient tracking and debugging. Additionally, the logger gracefully handles unhandled exceptions, ensuring comprehensive error monitoring throughout your application.

```typescript
try {
  throw new Error('Too Bad 💣');
}
catch(error) {
  this.logger.error({ message: 'Something bad happend here!', error: });
}
```

# Extra Configuration

## Anonymizing Logs

This library comes equipped with a built-in anonymizer designed to obfuscate sensitive keys in logs automatically. Should you require additional keys to be anonymized, or if you prefer to implement a custom anonymizer, you can easily extend the functionality by providing your own anonymizer or keys to the `configureLogger` handler.

By leveraging this feature, you can safeguard sensitive information within your logs, ensuring compliance with privacy regulations and bolstering the security of your application's logging system.

## Ignoring Routes for Inspection

Configuring specific routes to be excluded from inbound inspection is particularly useful for health checks or heavy endpoints. Wildcards are supported in the configurations, allowing for flexible route matching.

### Wildcard usage:

- `*` matches any number of tokens in the request.path

### Examples:

- '/v1/accounts/\*/holder'
- - Hides routes like /v1/accounts/:id/holder from inspection.
- '/v1/accounts/\*'
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

## License

Gedai is [MIT licensed](LICENSE).
