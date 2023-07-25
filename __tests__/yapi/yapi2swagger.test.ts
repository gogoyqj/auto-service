import yapiJSON2swagger, {
  obtainMeta,
  convertCosumes,
  convertParams,
  convertResponse
} from 'src/yapi/yapi2swagger';
import { mockData, yapiConfig, yapiConfigCompatible } from '../yapidata';

describe('yapi2swagger custom should work ok', () => {
  const data = mockData();
  const syntheticAPI = {
    ...data[0].list[1],
    url: '/test'
  };

  it('obtainMeta should work', () => {
    expect(obtainMeta(data, yapiConfig)).toMatchSnapshot('yapiJSON2swagger obtainMeta');
  });

  it('convertCosumes should work', () => {
    expect(convertCosumes(syntheticAPI, yapiConfig)).toMatchSnapshot(
      'yapiJSON2swagger convertCosumes'
    );
  });

  it('convertParams should work', () => {
    expect(convertParams(syntheticAPI, yapiConfig)).toMatchSnapshot(
      'yapiJSON2swagger convertParams'
    );
  });

  it('convertResponse should work', () => {
    expect(convertResponse(syntheticAPI, yapiConfig)).toMatchSnapshot(
      'yapiJSON2swagger convertResponse'
    );
  });

  it('yapiJSON2swagger should work', () => {
    expect(yapiJSON2swagger(data, yapiConfig)).toMatchSnapshot('yapiJSON2swagger yapiJSON2swagger');
  });
});

describe('yapi2swagger should work ok', () => {
  const data = mockData();
  const syntheticAPI = {
    ...data[0].list[1],
    url: '/test'
  };

  it('obtainMeta should work', () => {
    expect(obtainMeta(data, yapiConfigCompatible)).toMatchSnapshot('yapiJSON2swagger obtainMeta');
  });

  it('convertCosumes should work', () => {
    expect(convertCosumes(syntheticAPI, yapiConfigCompatible)).toMatchSnapshot(
      'yapiJSON2swagger convertCosumes'
    );
  });

  it('convertParams should work', () => {
    expect(convertParams(syntheticAPI, yapiConfigCompatible)).toMatchSnapshot(
      'yapiJSON2swagger convertParams'
    );
  });

  it('convertResponse should work', () => {
    expect(convertResponse(syntheticAPI, yapiConfigCompatible)).toMatchSnapshot(
      'yapiJSON2swagger convertResponse'
    );
  });

  it('yapiJSON2swagger should work', () => {
    expect(yapiJSON2swagger(data, yapiConfigCompatible)).toMatchSnapshot('yapiJSON2swagger yapiJSON2swagger');
  });
});
