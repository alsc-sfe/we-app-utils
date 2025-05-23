/* eslint-disable @typescript-eslint/no-use-before-define */
import pathToRegexp from 'path-to-regexp';
import { isString, isBoolean, isObj } from '../lang';
import { parseLocate, getPathnamePrefix } from './locate';
import { RouterType, ParseRoute, RouteObj, SimpleRoute, ParseRouteParams, RouteMatch, RouteMatchParams } from '@saasfe/we-app-types';

export function ajustPathname(pathname: string) {
  if (!isString(pathname)) {
    return pathname;
  }
  // 去除重复的/，否则路径匹配会出错
  let newPath = pathname.replace(/\/{2,}/g, '/');
  // 去除路径末尾的/，否则路径匹配会受限
  if (newPath !== '/' && newPath.slice(-1) === '/') {
    newPath = newPath.slice(0, newPath.length - 1);
  }
  return newPath;
}

// 所有的路由规则统一处理成添加了basename的形式，简化后续的处理方式
// 丢弃bool
export function parseRoute({
  route,
  basename = '',
  appBasename = '',
}: ParseRoute) {
  if (!route) {
    return [];
  }

  let routes = route;
  if (!Array.isArray(route)) {
    routes = [route];
  }

  const newRoutes: RouteObj[] = [];
  (routes as SimpleRoute[]).forEach(r => {
    if (isString(r)) {
      newRoutes.push({
        path: getRoutePathname({
          path: r as string,
          basename,
          appBasename,
        }),
      });
    } else if (isObj(r)) {
      const rt = r as RouteObj;
      let path = rt.path || rt.pathname;
      if (rt.absolute) {
        path = `~${path}`;
      }

      newRoutes.push({
        ...rt,
        path: getRoutePathname({
          // @ts-ignore
          path,
          basename,
          appBasename,
        }),
      });
    }
  });

  return newRoutes;
}

interface GetRoutePathnameParams {
  path: string;
  basename?: string;
  appBasename?: string;
}

export function isAbsolutePathname(pathname: string) {
  if (!isString(pathname)) {
    return false;
  }

  return pathname[0] === '~';
}

function getRoutePathname({
  path,
  basename = '',
  appBasename = '',
}: GetRoutePathnameParams) {
  if (!isString(path)) {
    return path;
  }

  let fullPathname = path;

  const absolute = isAbsolutePathname(path);
  const pathnamePrefix = getPathnamePrefix({
    basename,
    appBasename,
    absolute,
  });

  if (absolute) {
    fullPathname = fullPathname.slice(1) || '';
  }

  fullPathname = ajustPathname(`${pathnamePrefix}/${fullPathname}`);

  return fullPathname;
}

// route仅支持字符串，对象，字符串、对象的混合数组
export function parseRouteParams({
  route = '',
  locate = window.location,
  routerType = RouterType.browser,
  basename = '',
  appBasename = '',
}: ParseRouteParams) {
  const loc = parseLocate({
    locate,
    routerType,
    basename,
    appBasename,
  });
  const { pathname } = loc;

  const routes = parseRoute({
    route,
    basename,
    appBasename,
  });

  let params = {};

  for (let i = 0, len = routes.length; i < len; i += 1) {
    const tmpRoute = routes[i];
    // @ts-ignore
    const keys = [];
    // @ts-ignore
    const reg = pathToRegexp(tmpRoute.path, keys);
    if (keys.length > 0) {
      const match = reg.exec(pathname);
      if (match) {
        params = {};
        // @ts-ignore
        // eslint-disable-next-line
        keys.forEach((key, index) => {
          // @ts-ignore
          params[key.name] = match[index + 1];
        });
        break;
      }
    }
  }

  return params;
}

export function navigate(to: string) {
  if (window.history.pushState) {
    // @ts-ignore
    window.history.pushState(null, null, to);
  } else if (to?.indexOf('#') > -1) {
    window.location.hash = to;
  } else {
    window.location.href = to;
  }
}

export function getRouteSwitchConfig(gotoHref: string, routerType: RouterType) {
  const isBrowserHistory = routerType === RouterType.browser;
  const config = isBrowserHistory ? {
    onClick: (e: Event) => {
      e.preventDefault();
      navigate(gotoHref);
    },
  } : {};
  return config;
}

function matchRoute({
  route, exact, strict,
  locate = window.location,
  basename = '', appBasename = '',
  routerType = RouterType.browser,
}: RouteMatchParams): boolean {
  let match = false;

  const routes = parseRoute({
    // @ts-ignore
    route,
    basename,
    appBasename,
  });

  const loc = parseLocate({
    locate,
    routerType,
    basename,
    appBasename,
  });

  const { pathname } = loc;

  for (let i = 0, len = routes.length; i < len; i += 1) {
    const tmpRoute = routes[i];

    if (isObj(tmpRoute) && tmpRoute.path) {
      const tmpExact = isBoolean(tmpRoute.exact) ? tmpRoute.exact : exact;
      const tmpStrict = isBoolean(tmpRoute.strict) ? tmpRoute.strict : strict;
      const tmpPath = pathname;
      // @ts-ignore
      let keys = [];
      // pathToRegexp只匹配/one/:param的形式，但无法匹配/one/:param/two
      // @ts-ignore
      let regexp = pathToRegexp(tmpRoute.path, keys, {
        strict: tmpStrict,
      });
      if (keys.length > 0) {
        match = regexp.test(tmpPath);

        if (match) {
          break;
        }

        // pathToRegexp是完全匹配的，针对exact为false，需增加后置匹配
        if (!match && !tmpExact) {
          keys = [];
          // @ts-ignore
          regexp = pathToRegexp(`${tmpRoute.path}/.*`, keys, {
            strict: tmpStrict,
          });
        }
      }

      if (keys.length > 0) {
        match = regexp.test(tmpPath);
      } else {
        // 自行组装正则匹配
        // exact: 完全匹配, strict: 结尾无/
        if (tmpRoute.path !== '/') {
          regexp = new RegExp(`^${tmpRoute.path}${tmpExact ? '' : '(?:/.*)?'}${tmpStrict ? '' : '(?:/)?'}$`);
        } else {
          regexp = new RegExp(`^${tmpRoute.path}${tmpExact ? '' : '(?:.*)?'}${tmpStrict ? '' : '(?:/)?'}$`);
        }
        match = regexp.test(tmpPath);
      }

      if (match) {
        break;
      }
    }
  }

  return match;
}

export const DEFAULTRouteMatch: RouteMatch = function DEFAULTRouteMatch({
  route, routeIgnore, exact, strict,
  locate = window.location,
  basename = '',
  appBasename = '',
  routerType = RouterType.browser,
}) {
  // 需要先判断route是否匹配，再判断routeIgnore是否匹配
  // 因为会出现在route匹配的情况下，要剔除某些路由，
  // 如辰森供应链会先匹配/，再剔除掉开放平台的路由/stock/xxx
  const needIgnore = !!routeIgnore;

  let match = route === true ? true : matchRoute({
    route,
    exact,
    strict,
    locate,
    basename,
    appBasename,
    routerType,
  });

  if (needIgnore) {
    match = matchRoute({
      route: routeIgnore,
      exact,
      strict,
      locate,
      basename,
      appBasename,
      routerType,
    });
  }

  return needIgnore ? !match : match;
};
