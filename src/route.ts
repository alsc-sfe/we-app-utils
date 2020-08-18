import { Route, RouteObj, RouterType, GetGotoHrefParams } from '@saasfe/we-app-types';
import { isString, isObj } from './lang';

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

export function navigate(to: string) {
  if (window.history.pushState) {
    window.history.pushState(null, '', to);
  } else if (to?.indexOf('#') > -1) {
    window.location.hash = to;
  } else {
    window.location.href = to;
  }
}

interface GetGotoPathnameParams {
  to: Route;
  basename?: string;
  appBasename?: string;
}

// 路径由basename+微应用名称+页面路径，三部分构成
export function getPathnamePrefix({ basename = '', absolute = false, appBasename = '' }) {
  if (absolute) {
    return ajustPathname(`/${appBasename}`);
  }
  return ajustPathname(`/${basename}`);
}

export function isAbsolutePathname(pathname: string) {
  if (!isString(pathname)) {
    return false;
  }

  return pathname[0] === '~';
}

function getGotoPathname({
  to,
  basename = '',
  appBasename = '',
}: GetGotoPathnameParams) {
  let link = to.toString();

  if (isObj(to)) {
    const { path, pathname, query } = to as RouteObj;
    link = (path || pathname) as string;

    let search: string = query as string;
    if (isObj(query as object)) {
      // @ts-ignore
      const params = Object.keys(query).map(k => `${k}=${encodeURIComponent(query[k] || '')}`);
      search = params.join('&');
    }
    if (search) {
      link = `${link}?${search}`.replace('??', '?');
    }
  }

  const absolute = isAbsolutePathname(link);

  if (absolute) {
    link = link.slice(1);
  }

  let gotoPathname = link;
  // 应用内路径指定为/时，自动去除，以便于路径匹配，
  // href /org 可以匹配 pathname /org/
  // href /org/ 无法匹配 pathname /org
  const pathnamePrefix = getPathnamePrefix({ basename, absolute, appBasename });
  gotoPathname = ajustPathname(`${pathnamePrefix}${link === '/' ? '' : link}`);

  return gotoPathname;
}

// 返回带routerType的href
export function getGotoHref({
  to,
  routerType = RouterType.browser,
  basename = '',
  appBasename = '',
}: GetGotoHrefParams) {
  const gotoPathname = getGotoPathname({
    to,
    basename,
    appBasename,
  });
  const gotoHref = ajustPathname(`${routerType}${gotoPathname}`);

  return gotoHref;
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
