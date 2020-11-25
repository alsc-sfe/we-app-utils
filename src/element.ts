import { ContainerSelector } from '@saasfe/we-app-types';

export function getElement(selector: ContainerSelector, container: HTMLElement = document.body) {
  if (typeof selector === 'string') {
    return container.querySelector(selector);
  }
  return selector as HTMLElement;
}

export function isValidElement(el: HTMLElement) {
  return el && document.body.contains(el);
}
