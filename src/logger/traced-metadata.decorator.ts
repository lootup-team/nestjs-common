import { Reflector } from '@nestjs/core';

export const TracedMetadata =
  Reflector.createDecorator<{ name: string; value: string }[]>();
