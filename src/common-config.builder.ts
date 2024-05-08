import { ConfigurableModuleBuilder } from '@nestjs/common';
import { CommonConfigModuleOptions } from './common-config.options';

export const { MODULE_OPTIONS_TOKEN, ConfigurableModuleClass } =
  new ConfigurableModuleBuilder<CommonConfigModuleOptions>()
    .setClassMethodName('forRoot')
    .setFactoryMethodName('createOptions')
    .build();
