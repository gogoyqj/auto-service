/**
 * @file: 生成文档用
 * @author: yangqianjun
 * @Date: 2020-01-14 16:28:13
 * @LastEditors: yangqianjun
 * @LastEditTime: 2020-01-14 17:06:29
 */

import { IncomingMessage } from 'http';
import * as React from 'react';
import { ProxyHandleConfig, SMValidateInfo, SMAjaxConfig, SMAbstractResponse } from '../src/consts';

export class IProxyHandleConfig extends React.Component<ProxyHandleConfig> { }
export class ISMValidateInfo extends React.Component<SMValidateInfo> { }
export class ISMAjaxConfig extends React.Component<SMAjaxConfig> { }
export class ISMAbstractResponse extends React.Component<SMAbstractResponse> { }
export class IIncomingMessage extends React.Component<IncomingMessage> { }
