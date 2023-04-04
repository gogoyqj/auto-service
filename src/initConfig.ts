/* eslint-disable no-console */
import * as fs from 'fs';
import prompt from 'prompt';
import chalk from 'chalk';

const schema = {
  properties: {
    type: {
      pattern: /^(yapi|swagger)$/,
      description: '请选择接口文档类型 type，yapi 或者 swagger',
      required: false
    },
    remoteUrl: {
      description: '请输入接口文档源地址 remoteUrl，例如 https://yapi.com/api.json',
      required: false
    },
    url: {
      description: '请输入接口文档本地存储地址 url，例如：./swagger.json',
      required: false
    },
    output: {
      description: '请输入 service 代码输出目录 -o，例如: src/services',
      required: false
    }
  }
};

export default function initConfig(ConfigFile: string) {
  const defaultConfigJSON = {
    url: './swagger.json',
    remoteUrl: 'http://**',
    type: 'swagger',
    yapiConfig: {},
    swaggerParser: {
      '-o': 'src/services'
    },
    guardConfig: {
      mode: 'strict'
    }
  };
  prompt.start();
  prompt.get(schema, function(err, result) {
    const { type, remoteUrl, url, '-o': output } = result as any;
    type && (defaultConfigJSON.type = type);
    remoteUrl && (defaultConfigJSON.remoteUrl = remoteUrl);
    url && (defaultConfigJSON.url = url);
    output && (defaultConfigJSON.swaggerParser['-o'] = output);

    fs.writeFileSync(
      ConfigFile,
      `/**
   * @typedef { import("auto-service/lib/consts").JSON2Service } JSON2Service
   * @type {JSON2Service} 配置
  */
  module.exports = ${JSON.stringify(defaultConfigJSON, null, 2)}`,
      {
        encoding: 'utf8'
      }
    );

    console.log(chalk.green(`[INFO] 配置已保存至 ${ConfigFile}`));
  });
}
