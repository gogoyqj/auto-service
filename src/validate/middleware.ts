/* eslint-disable no-console */
import * as proxy from 'http-proxy-middleware';
import * as qs from 'qs';
import chalk from 'chalk';
import {
  SMAbstractRequest,
  SMAbstractResponse,
  SMAbstractNext,
  SMValidateInfo,
  SMValidator,
  ProxyHandleConfig
} from '../consts';
import { X_SM_PARAMS, X_SM_ERROR } from '../init';
import { getReadableDataAsync, getParams } from './utils';
import { defaultValidator } from './validator';

/** inject data for validation */
export interface CustomIncomingMessage {
  [X_SM_PARAMS]?: SMValidateInfo['send'];
  [X_SM_ERROR]?: string[] | null;
}

/**
 * @description validates input data from client to server and output data from server to client through a dev-server middleware
 */
export function createValidateMiddle(hooks?: SMAbstractNext) {
  return async <
    Req extends SMAbstractRequest,
    Res extends SMAbstractResponse,
    Next extends SMAbstractNext
  >(
    req: Req,
    res: Res,
    next?: Next
  ) => {
    if (hooks) {
      await hooks(req, res);
    }
    if (next) {
      next();
    }
  };
}

/** inject extra data into response */
export const responseHooksFactory = (
  cb: (res: Parameters<SMValidator>[0]) => ReturnType<SMValidator>
) => async (req: SMAbstractRequest & CustomIncomingMessage, res: SMAbstractResponse) => {
  const error: string[] = req[X_SM_ERROR] || [];
  const result: SMValidateInfo = {
    req,
    res,
    send: req[X_SM_PARAMS],
    receive: {
      status: res.statusCode || 200
    }
  };
  try {
    const bodyType = 'headers' in res ? res.headers['content-type'] : res.getHeader('content-type');
    if (typeof bodyType === 'string') {
      if (bodyType.match(/json/g)) {
        result.receive = {
          ...result.receive,
          body: JSON.parse(await getReadableDataAsync(res))
        };
      }
    }
  } catch (e) {
    error.push(`提取接口响应出错: ${e.message || e}`);
  }
  if (cb) {
    cb({
      code: error.length,
      message: error.join('\n'),
      result
    });
  }
  // reset injected data
  delete req[X_SM_ERROR];
  delete req[X_SM_PARAMS];
};

/**
 * @description trap webpackDevServer proxy
 * @param proxies
 * @param config
 */
export function proxyHandle(
  /** single or serveral proxy config */
  proxies: proxy.Config[] | proxy.Config,
  /** proxy handle config */
  config: ProxyHandleConfig
) {
  const { loadSwagger } = config;
  const requestMiddleware = createValidateMiddle(
    async (req: SMAbstractRequest & CustomIncomingMessage, _res: SMAbstractResponse) => {
      try {
        const { url: u = '' } = req;
        const [url] = u.split('?');
        const swagger = loadSwagger(url);
        const { basePath = '' } = swagger;
        const path = url.replace(new RegExp(`^${basePath}`), '');
        const { headers } = req;
        const smConfig = getParams(req, path);
        const body = await getReadableDataAsync(req);
        const bodyType = headers['content-type'];
        switch (bodyType) {
          case 'application/json':
          case 'javascript/json':
            smConfig.data = smConfig.body = JSON.parse(body);
            break;
          case 'multipart/form-data':
          case 'application/x-www-form-urlencoded':
            smConfig.form = smConfig.body = qs.parse(body);
            break;
        }
        req[X_SM_PARAMS] = smConfig;
      } catch (e) {
        req[X_SM_ERROR] = req[X_SM_ERROR] || [];
        req[X_SM_ERROR]?.push(`提取请求参数错误: ${e.message || e}`);
      }
    }
  );

  // create validation middleware
  const responseMiddleware = createValidateMiddle(
    responseHooksFactory(info => {
      return defaultValidator(info, {
        onValidate: info => {
          const { code, message } = info;
          if (code) {
            console.log(chalk.red(message));
          } else {
            console.log(chalk.green(message));
          }
        },
        ...config
      });
    })
  );

  // add validation middleware to proxy
  return (Array.isArray(proxies) ? proxies : [proxies]).map(
    (proxy): proxy.Config => {
      const { onProxyReq, onProxyRes } = proxy;
      return {
        ...proxy,
        onProxyReq: (proxyReq, req, res) => {
          requestMiddleware(req, res);
          if (onProxyReq) {
            onProxyReq(proxyReq, req, res);
          }
        },
        onProxyRes: (proxyRes, req, res) => {
          responseMiddleware(req, proxyRes);
          if (onProxyRes) {
            onProxyRes(proxyRes, req, res);
          }
        }
      };
    }
  );
}
