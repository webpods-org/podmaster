export type DomainResult<T> =
  | ({ success: true } & T)
  | {
      success: false;
      error: string;
      code: string;
    };
