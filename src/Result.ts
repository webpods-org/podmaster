export class ValidResult<T> {
  value: T;
  constructor(value: T) {
    this.value = value;
  }
}

export class InvalidResult<T, TInternal = {}> {
  error: T;

  constructor(error: T) {
    this.error = error;
  }
}
