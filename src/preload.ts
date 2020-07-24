import { Resource } from '@saasfe/we-app-types';

export enum ResourcePreloader {
  prefetch = 'prefetch',
  preload = 'preload'
}

export function resourcePreloader(url: Resource, type = ResourcePreloader.prefetch) {
  if (typeof url !== 'string' || !url) {
    return;
  }

  const link = document.createElement('link');
  link.rel = type;
  link.crossOrigin = 'anonymous';
  link.href = url;
  if (url.indexOf('.js') > -1) {
    link.as = 'script';
  } else if (url.indexOf('.css') > -1) {
    link.as = 'style';
  } else {
    return;
  }
  document.querySelector('head')?.appendChild(link);
}
