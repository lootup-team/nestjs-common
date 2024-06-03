import { ContextService } from '@gedai/nestjs-core';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  INestApplication,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { isAxiosError } from 'axios';
import { Observable, catchError } from 'rxjs';

@Injectable()
class CustomExceptionHandler implements NestInterceptor {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly contextService: ContextService) {}

  private handleRPCException(rawError: any): RpcException {
    const logLevel =
      rawError.status <= HttpStatus.BAD_REQUEST ? 'debug' : 'error';
    // TODO: how to supress NestJS Default Exception Handler from logging too?
    const exception = new RpcException(rawError);
    exception.stack = rawError.stack;
    this.logger[logLevel]({ message: rawError.message, error: exception });
    return exception;
  }

  private getBody(rawError: any): any {
    // TODO: will other http clients need a workaround too?
    if (isAxiosError(rawError) || !rawError.response) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      };
    }

    return rawError.response;
  }

  private handleHTTPException(rawError: any): HttpException {
    const body = this.getBody(rawError);
    body.trace = this.contextService.getCorrelationId();
    const exception = new HttpException(body, body.statusCode);
    exception.stack = rawError.stack;
    const logLevel =
      body.statusCode < HttpStatus.INTERNAL_SERVER_ERROR ? 'debug' : 'error';
    this.logger[logLevel]({ message: rawError.message, error: exception });
    return exception;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((rawError) => {
        if (!['http', 'graphql'].includes(context.getType())) {
          throw this.handleRPCException(rawError);
        }
        throw this.handleHTTPException(rawError);
      }),
    );
  }
}

export const configureExceptionHandler = (app: INestApplication) => {
  const contextService = app.get(ContextService);
  app.useGlobalInterceptors(new CustomExceptionHandler(contextService));
  Logger.log('Exceptions handler initialized', '@gedai/common/config');
  return app;
};
