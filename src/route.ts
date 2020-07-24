import { isString } from './lang';

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
