import { describe, expect, test } from "bun:test";
import { ErrorMessage } from "../../../src/http-server/route-handlers/validator.js";
import { assertGetParams } from "../../../src/http-server/route-handlers/validator.js";

describe("assertGetParams", () => {
  test("does not throw for valid GetParams", () => {
    const validParams = { id: "page-id" };

    expect(() => assertGetParams(validParams)).not.toThrow();
  });

  test("throws for non-object params", () => {
    const invalidParams = "not an object";

    expect(() => assertGetParams(invalidParams)).toThrow(Error);
    expect(() => assertGetParams(invalidParams)).toThrow(
      ErrorMessage.InvalidParams,
    );
  });

  test("throws for null params", () => {
    const invalidParams = null;

    expect(() => assertGetParams(invalidParams)).toThrow(Error);
    expect(() => assertGetParams(invalidParams)).toThrow(
      ErrorMessage.InvalidParams,
    );
  });

  test("throws for missing id", () => {
    const invalidParams = {};

    expect(() => assertGetParams(invalidParams)).toThrow(Error);
    expect(() => assertGetParams(invalidParams)).toThrow(
      ErrorMessage.InvalidId,
    );
  });

  test("throws for non-string id", () => {
    const invalidParams = { id: 123 };

    expect(() => assertGetParams(invalidParams)).toThrow(Error);
    expect(() => assertGetParams(invalidParams)).toThrow(
      ErrorMessage.InvalidId,
    );
  });
});
