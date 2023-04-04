/**
 * @file: 生成文档用
 * @author: yangqianjun
 * @Date: 2020-01-14 16:28:13
 * @LastEditors: yangqianjun
 * @LastEditTime: 2020-01-14 17:06:29
 */

import * as React from 'react';
import { CoreOptions } from 'request';
import { GuardConfig, YAPIConfig, SwaggerParser, JSON2Service } from '../src/consts';

export class IGuardConfig extends React.Component<GuardConfig> { }
export class IYAPIConfig extends React.Component<YAPIConfig> { }
export class ISwaggerParser extends React.Component<SwaggerParser> { }
export class IJSON2Service extends React.Component<JSON2Service> { }
export class IRequest extends React.Component<{ url?: string } & CoreOptions> { }
export class ISwaggerConfig extends React.Component<JSON2Service['swaggerConfig']> { }
