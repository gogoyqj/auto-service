/* eslint-disable @typescript-eslint/camelcase */
import { operationIdGuard } from 'src/guard';
import { SwaggerJson } from 'src/consts';

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

const optionIdMethodUrlMap = {
  personsUsingGET: 'get /api/v1/persons',
  personsUsingGET_1: 'get /api/v1/interviewer/persons'
};

const optionIdMethodUrlMap2 = {
  personsUsingGET: 'get /api/v1/interviewer/persons',
  personsUsingGET_1: 'get /api/v1/persons'
};

describe('validate/utils', () => {
  it('operationIdGuard should work ok', async () => {
    let swagger = getSwagger();
    let res = await operationIdGuard(swagger, {});
    expect(res).toMatchSnapshot('error');
    expect(swagger).toMatchSnapshot('error');

    swagger = getSwagger();
    res = await operationIdGuard(swagger, optionIdMethodUrlMap);
    expect(res).toMatchSnapshot('autofix');
    expect(swagger).toMatchSnapshot('autofix');

    swagger = getSwagger();
    swagger.paths = {};
    res = await operationIdGuard(swagger, optionIdMethodUrlMap);
    expect(res).toMatchSnapshot('remove error');
    expect(swagger).toMatchSnapshot('remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, optionIdMethodUrlMap);
    expect(res).toMatchSnapshot('partial remove error');
    expect(swagger).toMatchSnapshot('partial remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, optionIdMethodUrlMap2);
    expect(res).toMatchSnapshot('partial remove ok');
    expect(swagger).toMatchSnapshot('partial remove ok');
  });
});
