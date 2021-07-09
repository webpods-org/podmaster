export type OkResult<T> = { ok: true, value: T } ;
export type ErrResult = { ok: false; error: string; code: string };

export type Result<T> = OkResult<T> | ErrResult;
