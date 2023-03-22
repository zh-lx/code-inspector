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
export function composedPath(e: any) {
  // 存在则直接return
  if (e.path) {
    return e.path;
  }
  // 不存在则遍历target节点
  let target = e.target;
  e.path = [];
  while (target.parentNode !== null) {
    e.path.push(target);
    target = target.parentNode;
  }
  // 最后补上document和window
  e.path.push(document, window);
  return e.path;
}
