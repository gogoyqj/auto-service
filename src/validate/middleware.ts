import * as proxy from 'http-proxy-middleware';
import * as qs from 'qs';
import {
  SMAbstractRequest,
  SMAbstractResponse,
  SMAbstractNext,
  SMValidateInfo,
  SMValidator
} from 'src/types';
import { getReadableDataAsync, getParams } from './utils';
import { X_SM_PATH, X_SM_BASEPATH, X_SM_PARAMS, X_SM_ERROR } from './consts';
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
    const {
      headers: { [X_SM_PATH]: smPath, [X_SM_BASEPATH]: smBasePath }
    } = req;
    if ((smPath || smBasePath) && hooks) {
      await hooks(req, res, { path: smPath, basePath: smBasePath });
    }
    if (next) {
      next();
    }
  };
}

/**
 * @description http-proxy-middleware and yapi mock server
 */
export const requestMiddleware = createValidateMiddle(
  async (req: SMAbstractRequest, res: SMAbstractResponse) => {
    try {
      const { headers } = req;
      const smConfig = getParams(req);
      const body = await getReadableDataAsync(req);
      const bodyType = headers['content-type'];
      switch (bodyType) {
        case 'application/json':
        case 'javascript/json':
          smConfig.data = JSON.parse(body);
          break;
        // @cc: file
        case 'multipart/form-data':
        case 'application/x-www-form-urlencoded':
          smConfig.form = qs.parse(body);
          break;
      }
      req[X_SM_PARAMS] = smConfig;
    } catch (e) {
      req[X_SM_ERROR] = req[X_SM_ERROR] || [];
      req[X_SM_ERROR].push(`parse params failed with: ${e.message || e}`);
    }
  }
);

export const responseHooksFactory = (cb: SMValidator) => async (
  req: SMAbstractRequest,
  res: SMAbstractResponse,
  swagger: SMValidateInfo['swagger']
) => {
  const error: string[] = req[X_SM_ERROR] || [];
  let result: SMValidateInfo = {
    swagger,
    receive: {
      status: res.statusCode || 200
    }
  };
  try {
    const bodyType = 'headers' in res ? res.headers['content-type'] : res.getHeader('content-type');
    if (typeof bodyType === 'string') {
      // @cc: json only
      if (bodyType.match(/json$/g)) {
        const responseBody = await getReadableDataAsync(res);
        const smConfig = req[X_SM_PARAMS];
        result = {
          ...result,
          send: smConfig,
          receive: {
            ...result.receive,
            body: JSON.parse(responseBody)
          }
        };
      }
    }
  } catch (e) {
    error.push(`parse response failed with: ${e.message || e}`);
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
 * @description response
 */
export const responseMiddleware = createValidateMiddle(responseHooksFactory(defaultValidator));

/**
 * @description 劫持 webpackDevServer proxy 配置，以获取参数及相应
 */
export function proxyHandle(proxies: proxy.Config[]) {
  return proxies.map(
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
