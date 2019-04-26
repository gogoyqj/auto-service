### sm2service 双向校验中间件

#### 版本支持

```
  1.1.0+
```

@feat

```
  . 校验 query, path, postJSON, post form 参数是否符合约定
  . 校验 response json 是否符合约定
```

@todo

```
  . 不能正确校验 websocket 请求参数是否符合约定
  . 不能正确校验文件上传请求参数是否符合约定
  . 可能不能正确校验 headers 内参数是否符合约定
  . 未校验非 json 响应数据格式是否符合约定
```

#### webpackDevServer or http-proxy-middleware - 面向 FE & RD 前后端联调阶段

1. 初始化: 编辑 json2service.json 并重新生成 services 代码

   ```json
   {
     ...,
     "validateResponse": true // 生成校验物料
   }
   ```

1. 注入校验标志: 编辑 `@ajax` 实现，向 headers 内注入 - 目前需人工注入

   ```js
   import { X_SM_BASEPATH, X_SM_PATH } from 'sm2tsservice/lib/validate';

   let config = {
     ...extra,
     method: method.toLocaleLowerCase(),
     headers: {
       ...header,
       [X_SM_BASEPATH]: basePath,
       [X_SM_PATH]: path
     }
   };
   ```

1. 配置 proxy: 编辑 webpack proxy 配置

   ```js
      const { proxyHandle } = require('sm2tsservice/lib/validate');

      return {
        ...
        proxy: proxyHandle([{ ... }])
        ...
      }
   ```

1. 运行项目，任何未符合约定的接口调用，将抛出如下错误信息

   ```
      接口 /mix/{id}/ 参数不符合约定: data.body.id should be number
      接口 /mix/{id}/ 数据返回不符合约定: data.code should be number
      接口 /mix/{id}/ 参数不符合约定: data.body.id should be number
      接口 /mix/{id}/ 数据返回不符合约定: data.code should be number
   ```

#### todo - 面向 QA 测试人员

@todo

自动测试并校验
