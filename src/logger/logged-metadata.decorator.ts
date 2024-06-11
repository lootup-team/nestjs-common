import { Reflector } from '@nestjs/core';

export const LoggedMetadata =
  Reflector.createDecorator<{ name: string; value: string }[]>();
