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

/**
 * @description 双向校验
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
    // 不再强依赖 smPath & smBasePath，使用体验太差
    if (hooks) {
      await hooks(req, res);
    }
    if (next) {
      next();
    }
  };
}

export const responseHooksFactory = (
  cb: (res: Parameters<SMValidator>[0]) => ReturnType<SMValidator>
) => async (req: SMAbstractRequest, res: SMAbstractResponse) => {
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
      // @cc: json only
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
  delete req[X_SM_ERROR];
  delete req[X_SM_PARAMS];
};

/**
 * @description 劫持 webpackDevServer proxy 配置，以获取参数及相应
 * @param proxies
 * @param config
 */
export function proxyHandle(
  /** 单个或多个代理 */
  proxies: proxy.Config[] | proxy.Config,
  /** 配置信息 */
  config: ProxyHandleConfig
) {
  const { loadSwagger } = config;
  const requestMiddleware = createValidateMiddle(
    async (req: SMAbstractRequest, res: SMAbstractResponse) => {
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
          // @cc: file
          case 'multipart/form-data':
          case 'application/x-www-form-urlencoded':
            smConfig.form = smConfig.body = qs.parse(body);
            break;
        }
        req[X_SM_PARAMS] = smConfig;
      } catch (e) {
        req[X_SM_ERROR] = req[X_SM_ERROR] || [];
        req[X_SM_ERROR].push(`提取请求参数错误: ${e.message || e}`);
      }
    }
  );

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
