import { internet } from "faker";
import { sheets_v4 } from "googleapis";
import { connector_v1 } from "../../src/core/connector.v1";
import { MappingUtil } from "../../src/utils/v1/mapping-util";
import { APPSETTINGS_DEFAULT } from "../_helpers/constants";
import {
  createHullAccountUpdateMessages,
  createHullUserUpdateMessages,
} from "../_helpers/data-helpers";

describe("MappingUtil.v1", () => {
  describe("#constructor", () => {
    it("should initialize all readonly fields", () => {
      // Arrange
      const options = {
        hullAppSettings: APPSETTINGS_DEFAULT,
      };
      // Act
      const util = new MappingUtil(options);

      // Assert
      expect(util.appSettings).toEqual(options.hullAppSettings);
    });
  });

  describe("#mapMessagesToOutgoingEnvelopes()", () => {
    it("should map messages from user:update channel to envelopes", () => {
      // Arrange
      const options = {
        hullAppSettings: APPSETTINGS_DEFAULT,
      };

      const util = new MappingUtil(options);
      const messages = createHullUserUpdateMessages(5, [], 0, 5, 0, 0, 0, 0);

      // Act
      const result = util.mapMessagesToOutgoingEnvelopes({
        channel: "user:update",
        messages,
      });

      // Assert
      expect(result).toHaveLength(messages.length);
      result.forEach((r) => {
        expect(r.hullMessage).toBeDefined();
        expect(r.hullObjectType).toEqual("user");
      });
    });

    it("should map messages from account:update channel to envelopes", () => {
      // Arrange
      const options = {
        hullAppSettings: APPSETTINGS_DEFAULT,
      };

      const util = new MappingUtil(options);
      const messages = createHullAccountUpdateMessages(5, [], 0, 5, 0);

      // Act
      const result = util.mapMessagesToOutgoingEnvelopes({
        channel: "account:update",
        messages,
      });

      // Assert
      expect(result).toHaveLength(messages.length);
      result.forEach((r) => {
        expect(r.hullMessage).toBeDefined();
        expect(r.hullObjectType).toEqual("account");
      });
    });

    it("should throw if channel is not registered", () => {
      // Arrange
      const options = {
        hullAppSettings: APPSETTINGS_DEFAULT,
      };

      const util = new MappingUtil(options);
      const messages = createHullUserUpdateMessages(5, [], 0, 5, 0, 0, 0, 0);

      // Act and Assert
      expect(() => {
        util.mapMessagesToOutgoingEnvelopes({ channel: "foo", messages });
      }).toThrow(
        `Channel 'foo' is not registered. Allowed channels are ${[
          "user:update",
          "account:update",
        ].join(", ")}.`,
      );
    });
  });

  describe("#mapSheetsOneDimensionalValueRangeToArray()", () => {
    it("should map a range into an array", () => {
      // Arrange
      const options = {
        hullAppSettings: APPSETTINGS_DEFAULT,
      };
      const util = new MappingUtil(options);
      const sheetsRange: sheets_v4.Schema$ValueRange = {
        majorDimension: "ROWS",
        range: "Sheet1!A1:A3",
        values: [["domain"], [internet.domainName()], [internet.domainName()]],
      };

      // Act
      const result = util.mapSheetsOneDimensionalValueRangeToArray(sheetsRange);

      // Assert
      const expected = sheetsRange.values!.map((val) => val[0]);
      expect(result).toEqual(expected);
    });
  });

  describe("#mapCurrentRangeToInsertRange", () => {
    it("should map the current range to a proper insert range", () => {
      // Arrange
      const options = {
        hullAppSettings: APPSETTINGS_DEFAULT,
      };
      const util = new MappingUtil(options);
      const params: connector_v1.Params$MapCurrentRangeToInsertRange = {
        countOfCells: 5,
        rangeCurrent: {
          range: "Sheet1!A1:A10",
          majorDimension: "ROWS",
          values: [["domain"]],
        },
      };

      for (let index = 0; index < 9; index++) {
        params.rangeCurrent.values!.push([internet.domainName()]);
      }

      // Act
      const result = util.mapCurrentRangeToInsertRange(params);

      // Assert
      const expected = {
        maxRow: 15,
        range: "Sheet1!A11:A15",
        sheetTitle: "Sheet1",
      };
      expect(result).toEqual(expected);
    });
  });
});
