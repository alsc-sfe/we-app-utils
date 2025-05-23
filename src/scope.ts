import get from 'lodash-es/get';
import { HookScope, UsingScope, SafeHookScope, BaseType } from '@saasfe/we-app-types';

const BuildinProductName = '__buildin';
const HookAppName = 'hook';
const ScopeNameDivider = '/';

export {
  BuildinProductName,
  HookAppName,
  ScopeNameDivider,
};

export function getScopeName(scope: UsingScope) {
  if (typeof scope === 'string') {
    return scope;
  }

  const {
    productName = '',
    appName = '',
    pageName = '',
    hookName = '',
  } = scope;

  let pname = '';
  if (hookName) {
    // hook
    pname = `${BuildinProductName}${ScopeNameDivider}${HookAppName}${ScopeNameDivider}${hookName}`;
  } else {
    // page
    pname = `${productName}${ScopeNameDivider}${appName}${ScopeNameDivider}${pageName}`;
  }
  pname = pname.replace(new RegExp(`(${ScopeNameDivider})+`), ScopeNameDivider);
  if (pname[0] === ScopeNameDivider) {
    pname = pname.slice(1);
  }
  if (pname[pname.length - 1] === ScopeNameDivider) {
    pname = pname.slice(0, pname.length - 1);
  }
  return pname;
}

export function isAncestorScope(ancestor: HookScope, descendant: HookScope) {
  if (ancestor.product?.type === BaseType.root || ancestor.productType === BaseType.root) {
    return true;
  }

  if (
    ancestor.productName && !ancestor.appName &&
    ancestor.productName === descendant.productName
  ) {
    return true;
  }

  if (
    ancestor.productName && ancestor.appName && !ancestor.pageName &&
    ancestor.productName === descendant.productName &&
    ancestor.appName === descendant.appName &&
    descendant.pageName
  ) {
    return true;
  }

  return false;
}

export function makeSafeScope(scope: HookScope): SafeHookScope {
  if (!scope || !scope.product) {
    return {};
  }

  const { page, app, product } = scope;
  const base = page || app || product;

  const safeScope: SafeHookScope = {};

  safeScope.productType = get(product, 'type');

  const safeProperties = ['productName', 'appName', 'pageName',
    'hookName', 'root', 'sandbox'];
  safeProperties.forEach((property) => {
    safeScope[property] = get(scope, property);
  });

  const safeBaseFunctions = ['getConfig', 'getData', 'setData',
    'getResourceLoader', 'setResourceLoader', 'getRouterType'];
  safeBaseFunctions.forEach((property) => {
    let fn = get(base, property);
    if (fn) {
      fn = (fn as Function).bind(base);
    }
    safeScope[property] = fn;
  });

  const safePageFunctions = [
    'getPageContainer', 'setPageContainer',
    'getRender', 'setCustomProps', 'getBasename',
  ];
  safePageFunctions.forEach((property) => {
    let fn = get(page, property);
    if (fn) {
      fn = (fn as Function).bind(page);
    }
    safeScope[property] = fn;
  });

  return safeScope;
}
