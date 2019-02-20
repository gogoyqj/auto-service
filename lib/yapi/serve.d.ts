#!/usr/bin/env node
import { Json2Service } from '../cli';
export interface SwaggerParser {
  '-o'?: string;
  '-t'?: string;
  '-l'?: string;
}
export default function serve(
  url: string,
  yapiConfig: Json2Service['yapiConfig']
): Promise<{
  code: number;
  message?: string;
  result?: any;
}>;
