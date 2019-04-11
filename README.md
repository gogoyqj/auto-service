# sm2tsservice

## start

```shell
  java -version
  npm i
```

## config

json2service.json

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

```shell
  ./node_modules/.bin/sm2tsservice
  sm2tsservice
  sm2tsservice -c config.json # 指定配置文件
```
