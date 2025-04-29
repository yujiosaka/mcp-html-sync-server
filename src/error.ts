export class EnvParseError extends Error {
  constructor(
    public readonly variable: string,
    public readonly value: string,
    message?: string,
  ) {
    super(message || `Invalid environment variable ${variable}: ${value}`);
    this.name = "EnvParseError";
    Error.captureStackTrace(this, this.constructor);
  }
}
