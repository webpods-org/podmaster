export type APIResult<T> =
  | ({ success: true } & T)
  | {
      success: false;
      error: string;
      code: string;
    };