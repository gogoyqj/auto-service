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
    swaggerVersion: {
      description: '请输入 swagger 接口文档版本，例如：v2、v3，默认 v2（如果接口文档类型是 yapi 则可直接忽略）',
      required: false
    },
    outputType: {
      description: '请输入 service 代码输出类型，例如：services（生成类型和接口调用代码）, types（仅生成类型）, global（生成通过同一个全局方法重载实现类型化调用的代码），默认 services',
      required: false
    },
    output: {
      description: '请输入 service 代码输出目录 -o，例如: src/services',
      required: false
    }
  }
};

export default function initConfig(ConfigFile: string) {
  const defaultConfigJSON: Omit<Autos.JSON2Service, 'swaggerParser'> & {
    swaggerParser: Partial<Autos.JSON2Service['swaggerParser']>
  } = {
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
    const { type, remoteUrl, url, output, swaggerVersion, outputType } = result as any;
    type && (defaultConfigJSON.type = type);
    remoteUrl && (defaultConfigJSON.remoteUrl = remoteUrl);
    url && (defaultConfigJSON.url = url);
    output && (defaultConfigJSON.swaggerParser!['-o'] = output);
    // 'plugins/typescript-tkit' | 'plugins/types-only' | 'plugins/typescript-tkit-autos' | 'v3/plugins/typescript-tkit' | 'v3/plugins/types-only' | 'v3/plugins/typescript-tkit-autos'
    if (['v2', 'v3'].indexOf(swaggerVersion) !== -1 || ['services', 'types', 'global'].indexOf(outputType) !== -1) {
      defaultConfigJSON.swaggerParser!['-t'] = `${swaggerVersion === 'v3' ? 'v3/' : ''}plugins/${outputType === 'global' ? 'typescript-tkit-autos' : outputType === 'types' ? 'types-only' : 'typescript-tkit'}`;
    }

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
