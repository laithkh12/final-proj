export class ApiError extends Error {
  statusCode: number;
  errors?: { field: string; message: string }[];

  constructor(
    statusCode: number,
    message: string,
    errors?: { field: string; message: string }[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
