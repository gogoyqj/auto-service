### 3.6.0

支持增量更新 Service 文件，比如对于 API.ts，如果内容未发生变动，则不会重新生成 API.ts。

如果使用了自动格式化代码工具，需要在配置文件内配置 formater 参数来取代之前的调用方式，比如之前在 package.json 里配置：

```json
{
  "scripts": "autos -c json2service.js --clear && prettier src/services/**/**.ts --write"
}
```

需要移除 "prettier src/services/**/**.ts --write"，并在 json2service.js 里配置：

```js
{
  swaggerConfig: {
    formater: 'npx prettier {path}/**/**.ts --write --loglevel error --with-node-modules'
  },
}
```
