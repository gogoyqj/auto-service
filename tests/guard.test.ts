/* eslint-disable @typescript-eslint/camelcase */
import { operationIdGuard, strictModeGuard } from '@src/guard';
import { SwaggerJson, GuardConfig } from '@src/consts';

const url = '/api/v1/persons';
const url1 = '/api/v1/interviewer/persons';
function getSwagger(): SwaggerJson {
  return {
    basePath: '/',
    paths: {
      [url1]: {
        get: {
          operationId: 'personsUsingGET',
          parameters: [],
          responses: {
            '200': {
              description: 'OK'
            }
          },
          deprecated: false
        }
      },
      [url]: {
        get: {
          operationId: 'personsUsingGET_1',
          parameters: [],
          responses: {
            '200': {
              description: 'OK'
            }
          },
          deprecated: false
        }
      }
    }
  };
}

const optionIdMethodUrlMap: GuardConfig = {
  methodUrl2OperationIdMap: {
    'get /api/v1/persons': 'personsUsingGET',
    'get /api/v1/interviewer/persons': 'personsUsingGET_1'
  }
};

const optionIdMethodUrlMap2: GuardConfig = {
  methodUrl2OperationIdMap: {
    'get /api/v1/interviewer/persons': 'personsUsingGET',
    'get /api/v1/persons': 'personsUsingGET_1'
  }
};

describe('guard', () => {
  it('operationIdGuard should work ok', async () => {
    let swagger = getSwagger();
    let res = await operationIdGuard(swagger, {});
    expect(res).toMatchSnapshot('1 error');
    expect(swagger).toMatchSnapshot('1 error');

    swagger = getSwagger();
    res = await operationIdGuard(swagger, optionIdMethodUrlMap);
    expect(res).toMatchSnapshot('2 autofix');
    expect(swagger).toMatchSnapshot('2 autofix');

    swagger = getSwagger();
    swagger.paths = {};
    res = await operationIdGuard(swagger, optionIdMethodUrlMap);
    expect(res).toMatchSnapshot('3 remove error');
    expect(swagger).toMatchSnapshot('3 remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, optionIdMethodUrlMap);
    expect(res).toMatchSnapshot('4 partial remove error');
    expect(swagger).toMatchSnapshot('4 partial remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, optionIdMethodUrlMap2);
    expect(res).toMatchSnapshot('5 partial remove ok');
    expect(swagger).toMatchSnapshot('5 partial remove ok');
  });

  it('operationIdGuard safe mode should work ok', async () => {
    let swagger = getSwagger();
    let res = await operationIdGuard(swagger, { mode: 'safe' });
    expect(res).toMatchSnapshot('1 error');
    expect(swagger).toMatchSnapshot('1 error');

    swagger = getSwagger();
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'safe' });
    expect(res).toMatchSnapshot('2 autofix');
    expect(swagger).toMatchSnapshot('2 autofix');

    swagger = getSwagger();
    swagger.paths = {};
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'safe' });
    expect(res).toMatchSnapshot('3 remove error');
    expect(swagger).toMatchSnapshot('3 remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'safe' });
    expect(res).toMatchSnapshot('4 partial remove error');
    expect(swagger).toMatchSnapshot('4 partial remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'safe' });
    expect(res).toMatchSnapshot('5 partial remove ok');
    expect(swagger).toMatchSnapshot('5 partial remove ok');
  });

  it('operationIdGuard strict mode should work ok', async () => {
    let swagger = getSwagger();
    let res = await operationIdGuard(swagger, { mode: 'safe' });
    expect(res).toMatchSnapshot('1 error');
    expect(swagger).toMatchSnapshot('1 error');

    swagger = getSwagger();
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'strict' });
    expect(res).toMatchSnapshot('2 autofix');
    expect(swagger).toMatchSnapshot('2 autofix');

    swagger = getSwagger();
    swagger.paths = {};
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'strict' });
    expect(res).toMatchSnapshot('3 remove error');
    expect(swagger).toMatchSnapshot('3 remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'strict' });
    expect(res).toMatchSnapshot('4 partial remove error');
    expect(swagger).toMatchSnapshot('4 partial remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'strict' });
    expect(res).toMatchSnapshot('5 partial remove ok');
    expect(swagger).toMatchSnapshot('5 partial remove ok');
  });

  it('strictModeGuard should work ok', async () => {
    const swagger = getSwagger();
    swagger.tags = [
      {
        name: '错误',
        description: '这个tags不合格'
      },
      {
        name: 'xxx-controller',
        description: '这个tags不合格'
      },
      {
        name: 'ok',
        description: '这个tags合格'
      }
    ];
    const info = await strictModeGuard(swagger, { mode: 'strict' });

    expect(info).toMatchSnapshot('strictModeGuard');
  });
});
