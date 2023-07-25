/* eslint-disable @typescript-eslint/camelcase */
export function mockData(): Autos.YApiCategory[] {
  return ([
    {
      _id: 3326,
      up_time: 1552539591,
      name: '公共分类',
      desc: '公共分类',
      add_time: 1552539591,
      index: 0,
      list: [
        {
          _id: 50683,
          method: 'GET',
          title: 'test',
          path: '/api/test',
          res_body_type: 'json',
          add_time: 1557977116,
          up_time: 1680597855,
          res_schema_body:
            '{"$schema":"http://json-schema.org/draft-04/schema#","type":"object","properties":{"code":{"type":"number"},"result":{"type":"object","properties":{"id":{"type":"number"},"name":{"type":"string"}}}}}',
          markdown: '',
          desc: '',
          res_body: '',
          case_type: 'default',
          subscribeMember: [],
          index: 0,
          api_opened: false,
          res_body_is_json_schema: true,
          req_body_form: [],
          req_body_is_json_schema: false,
          req_params: [],
          req_headers: [],
          req_query: [
            {
              _id: '642be35f1e0411005be3d85f',
              desc: 'user id',
              example: '123',
              name: 'id',
              required: '1'
            }
          ],
          query_path: {
            path: '/api/test',
            params: []
          },
          type: 'static',
          delay: 0,
          tagTestCovered: false,
          tagPriority: null,
          status: 'undone',
          multi_cat: [],
          creater: 10,
          case_list: []
        },
        {
          _id: 83678,
          method: 'POST',
          title: '用户信息',
          path: '/userinfo',
          res_body_type: 'json',
          add_time: 1574845454,
          up_time: 1680597803,
          res_schema_body:
            '{\n   "type": "object",\n   "title": "emptyobject",\n   "properties": {}\n}',
          markdown: '',
          desc: '',
          req_body_other: '{\n   "id": 1234,\n   "name": "skia"\n}',
          req_body_type: 'json',
          res_body:
            '{\n   "code": 0,\n   "result": {\n      "id": 123,\n      "name": "skia"\n   }\n}',
          case_type: 'default',
          subscribeMember: [],
          index: 0,
          api_opened: false,
          res_body_is_json_schema: false,
          req_body_form: [],
          req_body_is_json_schema: false,
          req_params: [],
          req_headers: [
            {
              _id: '642be32b1e0411005be3d85e',
              value: 'application/json',
              name: 'Content-Type',
              required: '1'
            }
          ],
          req_query: [],
          query_path: {
            path: '/userinfo',
            params: []
          },
          type: 'static',
          delay: 0,
          tagTestCovered: false,
          tagPriority: null,
          status: 'undone',
          multi_cat: [],
          creater: 10,
          case_list: []
        }
      ],
      proBasepath: '',
      proName: 'test'
    },
    {
      _id: 124093,
      name: '数据',
      desc: null,
      add_time: 1680599639,
      up_time: 1680599639,
      index: 0,
      list: [
        {
          _id: 1041050,
          method: 'GET',
          title: '获取用户列表',
          path: '/list',
          res_body_type: 'json',
          add_time: 1680599655,
          up_time: 1680599714,
          res_body: '{\n   "code": 0,\n   "data": {}\n}',
          markdown: '',
          desc: '',
          res_schema_body:
            '{\n   "$schema": "http://json-schema.org/draft-04/schema#",\n   "type": "object",\n   "properties": {\n      "code": {\n         "type": "number"\n      },\n      "result": {\n         "type": "array",\n         "items": {\n            "type": "object",\n            "properties": {\n               "id": {\n                  "type": "number"\n               },\n               "name": {\n                  "type": "string"\n               }\n            }\n         }\n      }\n   }\n}',
          case_type: 'default',
          subscribeMember: [],
          index: 0,
          api_opened: false,
          res_body_is_json_schema: false,
          req_body_form: [],
          req_body_is_json_schema: false,
          req_params: [],
          req_headers: [],
          req_query: [
            {
              _id: '642beaa21e0411005be3d886',
              desc: '页码',
              example: '1',
              name: 'page',
              required: '1'
            },
            {
              _id: '642beaa21e0411005be3d885',
              desc: '每页条数',
              example: '20',
              name: 'pageSize',
              required: '0'
            }
          ],
          query_path: {
            path: '/list',
            params: []
          },
          type: 'static',
          delay: 0,
          tagTestCovered: false,
          tagPriority: null,
          status: 'undone',
          multi_cat: [],
          creater: 10,
          case_list: []
        }
      ],
      proBasepath: '',
      proName: 'test'
    }
  ] as unknown[]) as Autos.YApiCategory[];
}

export const yapiConfig: Autos.YAPIConfig = {
  categoryMap: {
    公共分类: 'common',
    数据: 'data'
  }
};

export const yapiConfigCompatible: Autos.YAPIConfig = {
  ...yapiConfig,
  _capatibleYAPI: true
};
