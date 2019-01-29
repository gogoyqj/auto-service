# sm2tsservice

## start

```shell
  java -version
  npm i
```

## config

json2service.json

| 参数          | 值               | 说明                                                                |
| ------------- | ---------------- | ------------------------------------------------------------------- |
| url           | url 或者文件地址 | swagger、yapi 文档 url 地址或者文件目录                             |
| type          | yapi、swagger    | 标记类型，默认是 swagger                                            |
| swaggerParser |                  | swagger-code-gen 配置                                               |
|               | -o               | 输出 typescript 代码目录，默认是当前 src/services                   |
|               | -t               | 模板目录，默认是工具内置模板目录 plugins/typescript-tkit/，避免修改 |
|               | -l               | 模板目录，默认是 typescript-angularjs，避免修改                     |

```json
{
  "url": "https://mock.corp.kuaishou.com/api/open/plugin/export?type=json&pid=40&status=all&token=afe1036223b8545d6fff",
  "type": "yapi",
  "swaggerParser": {
    "-o": "tmp/services"
  }
}
```

```shell
  ./node_modules/.bin/sm2tsservice
```
