import * as stream from 'stream';
import * as qs from 'qs';
import { X_SM_BASEPATH, X_SM_PATH, SMAbstractRequest, SMAbstractResponse } from 'src/consts';

export const Request: Partial<SMAbstractRequest> = {
  headers: {
    [X_SM_BASEPATH]: '/sm/api',
    [X_SM_PATH]: '/test'
  },
  method: 'get',
  url: '/sm/api/test?t=200'
};

export const Response: Partial<SMAbstractResponse> = {};

export const mockReadable = () => {
  const e = new stream.Writable({
    write(chunk, encoding, callback) {
      callback();
    }
  });
  return e;
};

// @cc: no number in form
export const testJSON = { id: '2', name: 'yqj' };

export const mockRequest = <H extends {}>(headers: H) => {
  const steam = mockReadable();
  const req: SMAbstractRequest = steam as any;
  req.headers = { ...req.headers, ...Request.headers, ...headers };
  setTimeout(() => {
    req.emit(
      'data',
      headers['content-type'] && headers['content-type'].match('json')
        ? JSON.stringify(testJSON)
        : qs.stringify(testJSON)
    );
    req.emit('end');
    req.destroy();
  }, 14);
  return req;
};
