#!/usr/bin/env node
export interface Json2Service {
  url: string;
  type?: 'yapi' | 'swagger';
  swaggerParser: SwaggerParser;
}
export interface SwaggerParser {
  '-o'?: string;
  '-t'?: string;
  '-l'?: string;
  '-i': string;
}
