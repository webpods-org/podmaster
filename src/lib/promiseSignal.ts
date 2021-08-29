type ResolveFn<T> = (value?: T | PromiseLike<T> | undefined) => void;

type RejectFn = (reason?: any) => void;

export default function promiseSignal<T>(): {
  promise: Promise<T>;
  resolve: ResolveFn<T>;
  reject: RejectFn;
} {
  let resolve: ResolveFn<T> = undefined as any;

  let reject: RejectFn = undefined as any;

  const promise: Promise<T> = new Promise<T>((fnResolve, fnReject) => {
    resolve = fnResolve as (value?: T | PromiseLike<T> | undefined) => void;
    reject = fnReject;
  });

  return { promise, resolve, reject };
}
