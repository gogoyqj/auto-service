import * as qs from 'qs';

/** convert a path to RegExp */
export const pathToReg = (path: string) => {
  return new RegExp(
    `^${path.replace(/{([^}]+)}/g, () => {
      return `([^/]+)`;
    })}$`,
    'g'
  );
};

/** obtain parameter names from path */
export const getPathParamsNames = (path: string) => {
  const params: string[] = [];
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

/** obtain parameter names from path and construct a record with names */
export const getPathParams = (pathTpl: string, path: string) => {
  const pathParamsNames = getPathParamsNames(pathTpl);
  if (pathParamsNames.length) {
    const pathParamsValues = (pathToReg(pathTpl).exec(path) || []).slice(1);
    return pathParamsNames.reduce<Record<string, any>>((pre, cur, index) => {
      pre[cur] = pathParamsValues[index];
      return pre;
    }, {});
  }
  return undefined;
};

/** obtain data from request */
export const getParams = (req: Autos.SMAbstractRequest, pathTpl: string) => {
  const { headers, method = '', url: u = '' } = req;
  const [url, search] = u.split('?');
  const p: Autos.SMValidateInfo['send'] = {
    method: method.toUpperCase() as Autos.SMAjaxConfig['method'],
    url,
    path: getPathParams(pathTpl, url),
    query: search ? qs.parse(search) : undefined,
    header: headers
  };
  return p;
};

/** obtain a readable data */
export const getReadableDataAsync = (
  readble: Autos.SMAbstractResponse | Autos.SMAbstractRequest
): Promise<string> =>
  new Promise((rs, rj) => {
    // TODO:  Buffer() is deprecated
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
