import { SMAbstractRequest, SMAbstractResponse } from 'src/types';
import { X_SM_BASEPATH, X_SM_PATH } from 'src/consts';

export const Request: Partial<SMAbstractRequest> = {
  headers: {
    [X_SM_BASEPATH]: '/sm',
    [X_SM_PATH]: '/api/test'
  }
};

export const Response: Partial<SMAbstractResponse> = {};
