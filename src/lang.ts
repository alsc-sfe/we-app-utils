import isFunction from 'lodash-es/isFunction';
import isBoolean from 'lodash-es/isBoolean';
import isString from 'lodash-es/isString';

export function isObj(obj: any, type = '[object Object]') {
  return Object.prototype.toString.call(obj) === type;
}

export {
  isFunction,
  isBoolean,
  isString,
};
