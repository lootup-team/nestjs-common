import {
  INestApplication,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { MODULE_OPTIONS_TOKEN } from '../common-config.builder';
import { CommonConfigModuleOptions } from '../common-config.options';

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
    return this.ignoredRoutes.some((x) => x.test(req.path.trim()));
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
      const duration = Date.now() - requestStartTimestamp;
      const logLevel = this.getLogLevel(res);
      this.logger[logLevel]({
        message: `[HTTP] [INBOUND] [${req.method}] [${req.path}] [${res.statusCode}] [${duration}ms]`,
        duration,
        request: {
          ip: req.ip,
          method: req.method,
          path: req.path,
          baseURL: `${req.protocol}://${req.get('host')}`,
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

export const configureHttpInspectorInbound = (app: INestApplication) => {
  const options = app.get<CommonConfigModuleOptions>(MODULE_OPTIONS_TOKEN);
  const { ignoreRoutes = [], mode = 'inbound' } =
    options.httpTrafficInspection ?? {};
  if (!['all', 'inbound'].includes(mode)) {
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
    ignoreRoutes.map((x) => new RegExp(`^${x.replace('*', '.+')}$`, 'i')),
  );
  const middleware = inspector.use.bind(inspector);

  Object.defineProperty(middleware, 'name', {
    value: HttpInspectorInboundMiddleware.name,
  });
  app.use(middleware);
  Logger.log('Inbound http inspection initialized', '@gedai/common/config');
  return app;
};
