import { describe, expect, test } from "bun:test";
import {
  ErrorMessage,
  assertConnectionParams,
} from "../../../src/http-server/websocket-handlers/validator.js";

describe("assertConnectionParams", () => {
  test("does not throw for valid ConnectionParams", () => {
    const validParams = { id: "page-id" };

    expect(() => assertConnectionParams(validParams)).not.toThrow();
  });

  test("throws for non-object params", () => {
    const invalidParams = "not an object";

    expect(() => assertConnectionParams(invalidParams)).toThrow(Error);
    expect(() => assertConnectionParams(invalidParams)).toThrow(
      ErrorMessage.InvalidParams,
    );
  });

  test("throws for null params", () => {
    const invalidParams = null;

    expect(() => assertConnectionParams(invalidParams)).toThrow(Error);
    expect(() => assertConnectionParams(invalidParams)).toThrow(
      ErrorMessage.InvalidParams,
    );
  });

  test("throws for missing id", () => {
    const invalidParams = {};

    expect(() => assertConnectionParams(invalidParams)).toThrow(Error);
    expect(() => assertConnectionParams(invalidParams)).toThrow(
      ErrorMessage.InvalidId,
    );
  });

  test("throws for non-string id", () => {
    const invalidParams = { id: 123 };

    expect(() => assertConnectionParams(invalidParams)).toThrow(Error);
    expect(() => assertConnectionParams(invalidParams)).toThrow(
      ErrorMessage.InvalidId,
    );
  });
});
