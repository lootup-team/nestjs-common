import { Logger } from '@nestjs/common';
import http from 'http';

export function parseSearchString(searchString?: string) {
  if (!searchString) {
    return [];
  }

  return Array.from(new URLSearchParams(searchString).entries()).map(
    ([k, v]) => ({ [k]: v }),
  );
}

export function parseData(headers: Record<string, any>, chunks: any[]) {
  const contentType =
    headers['Content-Type'] || headers['content-type'] || 'ignore';
  const rawData = Buffer.concat(chunks).toString();
  if (contentType.toLowerCase().includes('application/json')) {
    return JSON.parse(rawData);
  }
  return rawData;
}

export function logResponse(
  req: http.ClientRequest,
  res: http.IncomingMessage,
  requestChunks: any[],
  responseChunks: any[],
  logger: Logger,
  error?: Error,
) {
  const {
    statusCode: status,
    statusMessage: statusText,
    headers: responseHeaders,
  } = res;
  const getLogMethod = () => {
    if (error) return 'error';
    if (status >= 400) return 'warn';
    return 'log';
  };
  const getErrorIfNeeded = () => {
    if (error) return { error };
    return {};
  };
  const logMethod = getLogMethod();
  const [url, searchString] = req.path.split('?');
  const query = parseSearchString(searchString);
  const requestHeaders = req.getHeaders();
  logger[logMethod]({
    message: `[HTTP] [OUTBOUND] [${req.method}] [${url}] [${status}]`,
    ...getErrorIfNeeded(),
    request: {
      method: req.method,
      baseURL: `${req.protocol}//${req.host}`,
      path: req.path,
      url,
      query,
      headers: requestHeaders,
      body: parseData(requestHeaders, requestChunks),
    },
    response: {
      status,
      statusText,
      headers: responseHeaders,
      body: parseData(responseHeaders, responseChunks),
    },
  });
}

export function logRequestError(
  req: http.ClientRequest,
  requestDataChunks: any[],
  logger: Logger,
  error: Error,
) {
  const [url, searchString] = req.path.split('?');
  const headers = req.getHeaders();
  logger.warn({
    message: `[HTTP] [OUTBOUND] [${req.method}] [${url}] [${error.message}]`,
    error,
    request: {
      method: req.method,
      url,
      query: parseSearchString(searchString),
      headers: req.getHeaders(),
      body: parseData(headers, requestDataChunks),
    },
  });
}
