import { getParamSchema } from 'src/validate/validator';

describe('validate/validator', () => {
  const params = [
    { name: 'id', in: 'path', description: 'id', required: true, type: 'string' },
    { name: 'name', in: 'query', description: '', required: true, type: 'string' }
  ];
  it('getParamSchema ok', () => {
    const shema = getParamSchema(params);
    expect(shema).toMatchSnapshot();
  });
});
