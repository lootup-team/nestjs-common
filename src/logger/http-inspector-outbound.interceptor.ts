import { INestApplication, Logger } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';
import { MODULE_OPTIONS_TOKEN } from '../common-config.builder';
import { CommonConfigModuleOptions } from '../common-config.options';
import {
  logRequestError,
  logResponse,
  routeToRegex,
} from './http-inspector.utils';

const handleResponse =
  (
    logger: Logger,
    requestChunks: any[],
    callback: (res: http.IncomingMessage) => void,
  ) =>
  (res: http.IncomingMessage) => {
    const dataChunks = [];
    const req: http.ClientRequest = (res as any).req;
    res.on('data', (chunk) => dataChunks.push(chunk));
    res.on('end', () => {
      logResponse(req, res, requestChunks, dataChunks, logger);
    });
    res.on('error', (error) => {
      logResponse(req, res, requestChunks, dataChunks, logger, error);
    });
    callback(res);
  };

const withTrafficInspection = (
  logger: Logger,
  target:
    | typeof http.request
    | typeof https.request
    | typeof http.get
    | typeof https.get,
  allowedOutboundRoutes: RegExp[],
) =>
  function (...args: any[]) {
    const [urlOrOptions, callbackOrOptions, maybeCallback] = args;
    const requestDataChunks = [];
    const callback = maybeCallback || callbackOrOptions;

    const shouldIgnoreRoute = () => {
      return !allowedOutboundRoutes.some((x) =>
        x.test(
          typeof urlOrOptions === 'string'
            ? new URL(urlOrOptions).pathname.trim()
            : urlOrOptions.path.trim(),
        ),
      );
    };

    if (shouldIgnoreRoute()) {
      return target.apply(this, args);
    }

    const wrappedCallback = () =>
      handleResponse(logger, requestDataChunks, callback);
    let request: http.ClientRequest;
    if (typeof urlOrOptions === 'string' && maybeCallback) {
      request = target.apply(this, [
        urlOrOptions,
        callbackOrOptions,
        wrappedCallback(),
      ]);
    } else {
      request = target.apply(this, [urlOrOptions, wrappedCallback()]);
    }
    const originalWrite = request.write;
    request.write = function write(...args: any[]) {
      const [chunk] = args;
      requestDataChunks.push(chunk);
      return originalWrite.apply(this, args);
    };
    request.on('error', (error) => {
      logRequestError(request, requestDataChunks, logger, error);
    });
    return request;
  };

function mountInterceptor(
  logger: Logger,
  module: typeof http | typeof https,
  allowedOutboundRoutes: RegExp[],
) {
  for (const { target, name } of [
    { target: module.get, name: 'get' },
    { target: module.request, name: 'request' },
  ]) {
    const inspectedTarget = withTrafficInspection(
      logger,
      target,
      allowedOutboundRoutes,
    );
    Object.defineProperty(inspectedTarget, 'name', {
      value: name,
      writable: false,
    });
    module[name] = inspectedTarget;
  }
}

export const configureHttpInspectorOutbound = (app: INestApplication) => {
  const options = app.get<CommonConfigModuleOptions>(MODULE_OPTIONS_TOKEN);
  // TODO: add ignore routes
  const { mode, allowedOutboundRoutes } = options.httpTrafficInspection ?? {};
  if (!['all', 'outbound'].includes(mode)) {
    return app;
  }
  const logger = new Logger('OutboundHTTPInspection');
  for (const module of [http, https]) {
    mountInterceptor(logger, module, allowedOutboundRoutes.map(routeToRegex));
  }
  logger.log('Outbound http inspection initialized', '@gedai/common/config');
  if (allowedOutboundRoutes) {
    Logger.log(
      {
        message: 'Outbound HTTP Inspection is set to inspect routes',
        routes: allowedOutboundRoutes,
      },
      '@gedai/common/config',
    );
  }
  return app;
};
