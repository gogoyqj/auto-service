import { createValidateMiddle, responseHooksFactory } from 'src/validate/middleware';
import { X_SM_PARAMS, SMAbstractRequest, SMAbstractResponse, SMValidateInfo } from 'src/consts';
import { Request, Response, testJSON, mockRequest } from '../consts';

describe('validate/middleware', () => {
  it('createValidateMiddle ok', async () => {
    const hooks = jest.fn();
    const next = jest.fn();
    const middleware = createValidateMiddle(hooks);
    await middleware(Request as SMAbstractRequest, Response as SMAbstractResponse, next);
    expect(hooks).toBeCalledWith(Request, Response);
    expect(next).toBeCalled();
  });

  // it('requestMiddleware/json ok', async () => {
  //   const req = mockRequest({ 'content-type': 'application/json' });
  //   await requestMiddleware(req as any, Response as SMAbstractResponse);
  //   expect(req[X_SM_PARAMS].data).toMatchObject(testJSON);
  //   expect(req[X_SM_PARAMS].body).toMatchObject(testJSON);
  // });

  // it('requestMiddleware/form ok', async () => {
  //   const req = mockRequest({ 'content-type': 'application/x-www-form-urlencoded' });
  //   await requestMiddleware(req as any, Response as SMAbstractResponse);
  //   expect(req[X_SM_PARAMS].form).toMatchObject(testJSON);
  //   expect(req[X_SM_PARAMS].body).toMatchObject(testJSON);
  // });

  it('requestMiddleware/json ok', async () => {
    const hooks = jest.fn();
    const middleware = responseHooksFactory(hooks);
    const res = mockRequest({ 'content-type': 'application/json' });
    const swagger = {
      basePath: '/test/api',
      path: 'test'
    };
    await middleware(Request as SMAbstractRequest, res as any);
    const data: { code: number; message: string; result: SMValidateInfo } = {
      code: 0,
      message: '',
      result: {
        req: Request as any,
        res,
        send: undefined as any,
        receive: {
          body: testJSON,
          status: 200
        }
      }
    };
    expect(hooks).toBeCalledWith(data);
  });
});
