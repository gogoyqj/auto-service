import * as qs from 'qs';
import { SMAbstractRequest, SMAjaxConfig, SMAbstractResponse, SMValidateInfo } from 'src/types';
import { X_SM_PATH, X_SM_BASEPATH } from './consts';

export const pathToReg = (path: string) => {
  return new RegExp(
    `^${path.replace(/{([^}]+)}/g, () => {
      return `([^/]+)`;
    })}$`,
    'g'
  );
};

export const getPathParamsNames = (path: string) => {
  let params: string[] = [];
  path.replace(/{([^}]+)}/g, (all, param) => {
    params.push(param);
    return all;
  });
  return params;
};

export const concatPath = (...args: (string | string[] | undefined)[]) => {
  return args
    .map(arg => (Array.isArray(arg) ? arg.join('/') : arg !== undefined ? arg : ''))
    .join('/')
    .replace(/[/]{2,}/g, '/');
};

export const getPathParams = (pathTpl: string, path: string) => {
  const pathParamsNames = getPathParamsNames(pathTpl);
  if (pathParamsNames.length) {
    const pathParamsValues = (pathToReg(pathTpl).exec(path) || []).slice(1);
    return pathParamsNames.reduce((pre, cur, index) => {
      pre[cur] = pathParamsValues[index];
      return pre;
    }, {});
  }
  return undefined;
};

export const getParams = (req: SMAbstractRequest) => {
  const { headers, method = '', url: u = '' } = req;
  const { [X_SM_PATH]: smPath, [X_SM_BASEPATH]: smBasePath } = headers;
  const [url, search] = u.split('?');
  const p: SMValidateInfo['send'] = {
    method: method.toUpperCase() as SMAjaxConfig['method'],
    url,
    path: getPathParams(concatPath(smBasePath, smPath), url),
    query: search ? qs.parse(search) : undefined,
    header: headers
  };
  return p;
};

export const getReadableDataAsync = (
  readble: SMAbstractResponse | SMAbstractRequest
): Promise<string> =>
  new Promise((rs, rj) => {
    let buffer = new Buffer('');
    readble.on('data', data => {
      buffer = Buffer.concat([buffer, typeof data === 'string' ? new Buffer(data) : data]);
    });
    readble.once('end', () => {
      rs(buffer.toString());
    });
    readble.once('error', e => {
      rj(e.message);
    });
  });
