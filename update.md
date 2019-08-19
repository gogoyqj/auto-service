# 风险处置指南

## 技术方案介绍

### 关键词

#### tags

生成与 tags 一一对应的 service 文件，比如 `"User" => "UserApi.ts"` - 所以 tags 一旦设定不许更改

工具不能处理中文 - 所以要求 tags 必须为中文，所以 yapi 需要中英文映射

```js
  "yapiConfig": {
    "categoryMap": {
      "中文": "English"
    }
  }
```

#### operationId

每个接口全局唯一的操作 id，通过 `controller method name + Using + http method name`，出现重名会自增一 - 但顺序不可控，工具通过 operationId 生成接口调用代码，因此存在逻辑错乱的风险，协作方无法预测并告知变动

#### safe

基于 `url + Using + http method` 生成 `operationId` - 唯一且可控，以上因素的变动，协作方有通知义务

#### strict

在 `safe` 的基础上，添加对 `tags` `definitions` 命名规范校验

#### DTO

swagger 定义的数据结构，对应生成 typescript interface - 工具无法处理中文，因此 DTO 名字必须是英文

#### params

参数、变量名必须是小驼峰格式 - 及符合前端代码规范、合法的变量名、属性名

### 接口文档

#### swagger

```java
  // 控制器
  @Api(tags="English", description="中文描述") // tags 用以生成 service 分组，默认值为 any-controller 类名
  class AnyController {
    @ApiOperation(value="概述", notes="详细描述")
    @ApiParam(name = "gender", value = "性别", required = true) // name 必须使用小驼峰
    public doSomething() {} // 生成 operationId，比如 doSomethingUsingGet_1, doSomethingUsingGet_2
  }

  // DTO
  @Data
  @ApiModel(value="English", description="用户基本信息") // 必须手写 value，使用[a-zA-Z0-9]
  public class UserVO {}
```

#### mock

```shell
  接口分类 => tags
```

## 处置指南

### 升级工具

```shell
npm i -D @tkit/service // 公司内 3.0.7+
npm i -D sm2tsservice  // 公司外部 1.1.8+
```

### 处置方式

#### 公共逻辑

##### 参数格式校验

工具要求新老项目参数必须是小驼峰英文格式，否则报错，生成失败

#### 特殊逻辑

通过 `mode` 控制工具的行为

```js
{
  "guardConfig": {
    "mode": "strict" | "safe" | undefined
  }
}
```

##### 维持现状

老项目，不配置 `mode`，重新生成 service 代码，如果检测到风险 operationId，则抛错错误生成失败，输出映射关系，请手动将提示添加到配置文件内，并提交到仓库，如：

```js
  "guardConfig": {
    "methodUrl2OperationIdMap": {
      {
        "get /api/xxx/xxx": "operationId",
        ...
      }
    }
  }
```

后续有任何变动的时候，工具会根据本地已有映射关系对 swagger 返回 `operationId` 进行校正，并对增删改做出检测提示，确保业务逻辑不受影响

##### 安全模式

老项目，也可以配置 `mode` 为 `"safe"`，则工具会基于 `url + Using + http method` 生成新的 `operationId` 以生成更安全和语义化的接口调用代码，但需满足

- 已保存 `methodUrl2OperationIdMap` 映射关系锁定
- 人工更新 service 调用

工具会自动生成 `旧接口调用` => `新接口调用` 映射关系，请自上而下依次全局替换即可，如：

```js
{
  "getUserNameUsingGet_2": "getUserNameUsingGet",
  "getUserNameUsingGet_1": "getNameUsingGet",
}
```

##### 严格模式

新项目，一律配置 `mode` 为 `"strict"`，采用 `"safe"` 相同的 `operationId` 生成策略

- 要求 swagger 文档 `tags` `definitions` `params` 符合命名规范
- 【暂时】仍要求先保存 `methodUrl2OperationIdMap` 映射关系锁定，再重新生成
- 可直接忽略旧、新接口调用映射关系提示
