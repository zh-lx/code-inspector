// 防抖
export function debounce(fn: any, delay: number) {
  let timer: any = null;
  return function () {
    // @ts-ignore
    let context = this;
    let args = arguments;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

// 兼容 chrome 最新版，获取 e.path
export function composedPath(e: Event) {
  return e.composedPath() as HTMLElement[];
}
