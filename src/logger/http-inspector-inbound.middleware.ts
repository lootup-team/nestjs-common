import {
  INestApplication,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

@Injectable()
class HttpInspectorInboundMiddleware implements NestMiddleware {
  private logger = new Logger('InboundHTTPInspection');

  constructor(private readonly ignoredRoutes: RegExp[]) {}

  private getLogLevel(res: Response) {
    const statusCode = res.statusCode;
    if (statusCode >= 500) {
      return 'error';
    }
    if (statusCode >= 400) {
      return 'warn';
    }
    return 'log';
  }

  private shouldIgnoreRoute(req: Request) {
    return this.ignoredRoutes.some((x) => x.test(req.path));
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (this.shouldIgnoreRoute(req)) {
      return next();
    }

    let responseBody = null;
    const requestStartTimestamp = Date.now();
    const originalSend = res.send;
    res.send = (body) => {
      if (!responseBody) {
        responseBody = body;
      }
      res.send = originalSend;
      return res.send(body);
    };

    const originalJson = res.json;
    res.json = (body) => {
      if (!responseBody) {
        responseBody = body;
      }
      res.json = originalJson;
      return res.json(body);
    };

    res.on('finish', () => {
      const executionTimeMillis = `${Date.now() - requestStartTimestamp}ms`;
      const logLevel = this.getLogLevel(res);
      this.logger[logLevel]({
        message: `[HTTP] [INBOUND] [${req.method}] [${req.path}] [${res.statusCode}] [${executionTimeMillis}]`,
        executionTime: executionTimeMillis,
        request: {
          method: req.method,
          url: req.originalUrl,
          headers: req.headers,
          body: req.body,
          query: req.query,
        },
        response: {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.getHeaders(),
          body: responseBody,
        },
      });
    });

    next();
  }
}

type InspectionOptions = {
  ignoreRoutes: string[];
};

export const configureHttpInspectorInbound =
  (opts?: InspectionOptions) => (app: INestApplication) => {
    const { ignoreRoutes } = opts || {};
  const configService = app.get(ConfigService);
  const httpInspection = configService.get('INSPECT_HTTP_TRAFFIC', 'all');
  if (!['all', 'inbound'].includes(httpInspection)) {
    return app;
  }

    if (ignoreRoutes) {
      Logger.log(
        {
          message: 'HTTP Inspection is set to ignore routes',
          routes: ignoreRoutes,
        },
        '@gedai/common/config',
      );
    }

    const inspector = new HttpInspectorInboundMiddleware(
      ignoreRoutes.map((x) => new RegExp(`^${x.replace('*', '.*')}$`, 'gi')),
    );
  const middleware = inspector.use.bind(inspector);

  Object.defineProperty(middleware, 'name', {
    value: HttpInspectorInboundMiddleware.name,
  });
  app.use(middleware);
  Logger.log('Inbound http inspection initialized', '@gedai/common/config');
  return app;
};
