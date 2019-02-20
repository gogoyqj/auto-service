#!/usr/bin/env node
export interface Json2Service {
  url: string;
  type?: 'yapi' | 'swagger';
  yapiConfig?: {
    required?: boolean;
  };
  swaggerParser?: SwaggerParser;
  validateResponse?: boolean;
}
export interface SwaggerParser {
  '-o'?: string;
  '-t'?: string;
  '-l'?: string;
  '-i': string;
}
