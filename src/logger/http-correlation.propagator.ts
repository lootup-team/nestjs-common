import { ContextService } from '@lootupteam/nestjs-core';
import { INestApplication, Logger } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';

function appendCorrelationIdToHeaders(
  options: http.RequestOptions,
  contextId: string,
) {
  if (!options.headers) {
    options.headers = {};
  }
  options.headers['x-correlation-id'] = contextId;
}

function mountCorrelationInterceptor(
  context: ContextService,
  module: typeof http | typeof https,
) {
  const withCorrelationId = (
    target: typeof module.get | typeof module.request,
  ) =>
    function (...args: any[]) {
      const correlationId = context.getCorrelationId();
      if (!correlationId) {
        return target.apply(this, args);
      }
      const [urlOrOptions, optionsOrCallback, maybeCallback] = args;
      // http.get(url, options, callback)
      if (typeof urlOrOptions === 'string' && maybeCallback) {
        appendCorrelationIdToHeaders(optionsOrCallback, correlationId);
        return target.apply(this, [
          urlOrOptions,
          optionsOrCallback,
          maybeCallback,
        ]);
      }
      // http.get(url, callback)
      if (typeof urlOrOptions === 'string') {
        const options = {};
        appendCorrelationIdToHeaders(options, correlationId);
        return target.apply(this, [urlOrOptions, options, optionsOrCallback]);
      }
      // http.get(options, callback)
      appendCorrelationIdToHeaders(urlOrOptions, correlationId);
      return target.apply(this, [urlOrOptions, optionsOrCallback]);
    };
  const targets = [
    { target: module.get, name: 'get' },
    { target: module.request, name: 'request' },
  ];
  for (const { target, name } of targets) {
    const correlatedTarget = withCorrelationId(target);
    Object.defineProperty(correlatedTarget, 'name', {
      value: name,
      writable: false,
    });
    module[name] = correlatedTarget;
  }
}

export const configureOutboundHttpCorrelationPropagation = (
  app: INestApplication,
) => {
  const context = app.get(ContextService);
  for (const module of [http, https]) {
    mountCorrelationInterceptor(context, module);
  }
  Logger.log(
    'Http Correlation Propagation initialized',
    '@gedai/common/config',
  );
  return app;
};
