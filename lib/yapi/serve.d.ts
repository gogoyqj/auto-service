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
}
export default function serve(
  url: string
): Promise<{
  code: number;
  message?: string;
  result?: any;
}>;
