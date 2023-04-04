import * as stream from 'stream';
import * as qs from 'qs';

export const Request: Partial<Autos.SMAbstractRequest> = {
  headers: {},
  method: 'get',
  url: '/sm/api/test?t=200'
};

export const Response: Partial<Autos.SMAbstractResponse> = {};

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

export const mockRequest = <H extends Record<string, any>>(headers: H) => {
  const steam = mockReadable();
  const req: Autos.SMAbstractRequest = steam as any;
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
