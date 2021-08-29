export type OkResult<T> = { ok: true, value: T } ;
export type ErrResult = { ok: false; error: string; code: string, data?: any };

export type Result<T> = OkResult<T> | ErrResult;
