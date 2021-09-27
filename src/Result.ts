export function unwrap<T, TError, TNext, TNextError>(
  result: ValidResult<T> | InvalidResult<TError>,
  fn: (x: T) => ValidResult<TNext> | InvalidResult<TNextError>
): ValidResult<TNext> | InvalidResult<TError | TNextError> {
  if (result instanceof ValidResult) {
    return fn(result.value);
  } else if (result instanceof InvalidResult) {
    return result as InvalidResult<TError>;
  } else {
    return result as InvalidResult<TError>;
  }
}

export function unwrapAsync<T, TError, TNext, TNextError>(
  result: ValidResult<T> | InvalidResult<TError>,
  fn: (x: T) => Promise<ValidResult<TNext> | InvalidResult<TNextError>>
):
  | Promise<ValidResult<TNext> | InvalidResult<TNextError>>
  | InvalidResult<TError> {
  if (result instanceof ValidResult) {
    return fn(result.value);
  } else if (result instanceof InvalidResult) {
    return result as InvalidResult<TError>;
  } else {
    return result as InvalidResult<TError>;
  }
}

export class ValidResult<T> {
  value: T;
  constructor(value: T) {
    this.value = value;
  }
}

export class InvalidResult<T> {
  error: T;

  constructor(error: T) {
    this.error = error;
  }
}