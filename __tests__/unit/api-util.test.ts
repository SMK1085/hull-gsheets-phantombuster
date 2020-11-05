import { ApiUtil } from "../../src/utils/v1/api-util";
import { internet, random } from "faker";
import { connector_v1 } from "../../src/core/connector.v1";

describe("ApiUtil", () => {
  describe("handleApiResultError", () => {
    it("should return a proper error result", () => {
      // Arrange
      const url = internet.url();
      const method = "post";
      const payload = {
        foo: "bar",
      };
      const error = new Error(random.words(10));

      // Act
      const result = ApiUtil.handleApiResultError(url, method, payload, error);

      // Assert
      const expected: connector_v1.Schema$ApiResult<any, undefined, Error> = {
        data: undefined,
        endpoint: url,
        error: error.message,
        method,
        payload,
        success: false,
        errorDetails: error,
      };
      expect(result).toEqual(expected);
    });
  });
});
