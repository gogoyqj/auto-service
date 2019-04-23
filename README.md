# sm2tsservice

## start

```shell
  cd yourProjectName
  java -version
  npm i sm2tsservice -D
```

## config

edit json2service.json

| 参数             | 值               | 说明                                                                                                                                               |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| url              | url 或者文件地址 | swagger、yapi 文档 url 地址或者文件目录，注意：如果是本地文件，文件名不能以 http 开头                                                              |
| type             | yapi、swagger    | 标记类型，默认是 swagger                                                                                                                           |
| swaggerParser    |                  | swagger-code-gen 配置                                                                                                                              |
|                  | -o               | 输出 typescript 代码目录，默认是当前 src/services                                                                                                  |
|                  | -t               | 模板目录，默认是工具内置模板目录 plugins/typescript-tkit/，避免修改                                                                                |
|                  | -l               | 模板目录，默认是 typescript-angularjs，避免修改                                                                                                    |
| validateResponse | boolean          | 是否生成校验逻辑，默认 false                                                                                                                       |
| yapiConfig       |                  | yapi 相关配置                                                                                                                                      |
|                  | required         | 当直接使用 yapi json 定义返回数据格式的时候，生成的 typescript 文件，默认情况下，所有字段都是可选的，配置成 true，则所有字段都是不可缺省的         |
|                  | bodyJsonRequired | 当直接使用 yapi json 定义 json 格式 body 参数的时候，生成的 typescript 文件，默认情况下，所有字段都是可选的，配置成 true，则所有字段都是不可缺省的 |

```json
{
  "url": "./api.json",
  "type": "yapi",
  "yapiConfig": {
    "required": false,
    "bodyJsonRequired": false
  },
  "swaggerParser": {
    "-o": "tmp/services"
  },
  "validateResponse": false // 是否生成校验逻辑
}
```

参考下方代码，实现 ajax 类【如果使用的 axios，且后端返回数据结构遵循 `{ code?:number;message?:string;result: any }`，可直接复制使用】

```ts
import axios, { AxiosError } from 'axios';

const inst = axios.create({
  timeout: 2000,
  withCredentials: true,
  headers: {}
});

// @cc: 检测 axios 响应状态
function onStatusError(error: AxiosError | Error) {
  const err =
    'response' in error && error.response
      ? {
          code: error.response.status,
          message: error.response.statusText
        }
      : { code: 10001, message: error.message };
  if (err.code === 401 || err.code === 403) {
    EventCenter.emit('common.user.status', err);
  }
  return err;
}

export type AjaxPromise<R> = Promise<R>;

export interface ExtraFetchParams {
  extra?: any;
}

export interface WrappedFetchParams extends ExtraFetchParams {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'PATCH' | 'HEAD';
  url: string;
  data?: any; // post json
  form?: any; // post form
  query?: any;
  header?: any;
  path?: any;
}

export class WrappedFetch {
  /**
   * @description ajax 方法
   */
  public ajax(
    { method, url, data, form, query, header, extra }: WrappedFetchParams,
    path?: string,
    basePath?: string
  ) {
    let config = {
      ...extra,
      method: method.toLocaleLowerCase(),
      headers: { ...header }
    };
    // json
    if (data) {
      config = {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'application/json'
        },
        data
      };
    }
    // form
    if (form) {
      config = {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify(form)
      };
    }
    return inst
      .request({ ...config, url, params: query })
      .then(res => res.data)
      .catch(onStatusError);
  }

  /**
   * @description 接口传参校验
   */
  public check<V>(value: V, name: string) {
    if (value === null || value === undefined) {
      const msg = `[ERROR PARAMS]: ${name} can't be null or undefined`;
      // 非生产环境，直接抛出错误
      if (process.env.NODE_ENV === 'development') {
        throw Error(msg);
      }
    }
  }
}

export default new WrappedFetch();
```

配置 tsconfig.json[如未使用 ts-loader，还需要配置 webpack alias]

```json
{
  "paths": {
    "@ajax": ["你的实现文件地址"]
  }
}
```

```shell
  ./node_modules/.bin/sm2tsservice # 使用默认配置
  ./node_modules/.bin/sm2tsservice -c config.json # 指定配置文件
  ./node_modules/.bin/sm2tsservice --clear # 清空上次生成产物
```

或可以写入 `package.json`，通过 `npm run api` 使用

```json
{
  "scripts": {
    "api": "sm2tsservice --clear"
  }
}
```
