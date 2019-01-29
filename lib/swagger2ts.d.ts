import { SwaggerParser } from 'src';
export default function swagger2ts(
  swaggerParser: SwaggerParser
): Promise<{
  code: Number;
  message?: string;
}>;
