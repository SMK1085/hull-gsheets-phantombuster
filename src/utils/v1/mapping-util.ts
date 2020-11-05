import { sheets_v4 } from "googleapis";
import { first, get, isNil, last, min } from "lodash";
import { connector_v1 } from "../../core/connector.v1";
import { hull_v1 } from "../../core/hull.v1";

export class MappingUtil {
  public readonly appSettings: connector_v1.Schema$AppSettings;
  private readonly registerMapMessages: {
    [key: string]: (
      params: connector_v1.Params$MapMessagesToEnvelopes<any>,
    ) => connector_v1.Schema$OutgoingOperationEnvelope<any, unknown>[];
  };

  constructor(options: connector_v1.Schema$DiRegistrationOptions) {
    this.appSettings = options.hullAppSettings;
    // Registered mappings for messages to envelopes
    this.registerMapMessages = {
      "user:update": this.mapMessagesUserUpdateToOutgoingEnvelopes.bind(this),
      "account:update": this.mapMessagesAccountUpdateToOutgoingEnvelopes.bind(
        this,
      ),
    };
  }

  public mapMessagesToOutgoingEnvelopes<THullMessage>(
    params: connector_v1.Params$MapMessagesToEnvelopes<THullMessage>,
  ): connector_v1.Schema$OutgoingOperationEnvelope<THullMessage, unknown>[] {
    if (!Object.keys(this.registerMapMessages).includes(params.channel)) {
      throw new Error(
        `Channel '${
          params.channel
        }' is not registered. Allowed channels are ${Object.keys(
          this.registerMapMessages,
        ).join(", ")}.`,
      );
    }

    return this.registerMapMessages[params.channel](params);
  }

  public mapSheetsOneDimensionalValueRangeToArray(
    params: sheets_v4.Schema$ValueRange,
  ): any[] {
    if (isNil(params.values)) {
      return [];
    }

    return params.values.map((val) => {
      return val[0];
    });
  }

  public mapEnvelopesToServiceObjects<THullMessage>(
    envelopes: connector_v1.Schema$OutgoingOperationEnvelope<
      THullMessage,
      unknown
    >[],
  ): connector_v1.Schema$OutgoingOperationEnvelope<THullMessage, string>[] {
    return envelopes.map((envelope) => {
      const attribName =
        envelope.hullObjectType === "user"
          ? (this.appSettings.user_attribute as string)
          : (this.appSettings.account_attribute as string);
      const attribVal = get(
        get(envelope, `hullMessage.${envelope.hullObjectType}`, undefined),
        attribName,
        undefined,
      );

      return {
        ...envelope,
        serviceObject: attribVal,
        serviceOperation: "WRITE",
      };
    });
  }

  public mapCurrentRangeToInsertRange(
    params: connector_v1.Params$MapCurrentRangeToInsertRange,
  ): connector_v1.Schema$MapCurrentRangeToInsertRange {
    const regExp = /(\d+)/;
    const sheet = first(params.rangeCurrent.range!.split("!"));
    const firstCellAddress = first(
      params.rangeCurrent.range!.replace(`${sheet}!`, "").split(":"),
    );
    const lastCellAddress = last(params.rangeCurrent.range!.split(":"));
    const firstRow = parseInt(firstCellAddress!.match(regExp)![0], 10);
    const lastRow = parseInt(lastCellAddress!.match(regExp)![0], 10);
    const rowsWithData = params.rangeCurrent.values
      ? params.rangeCurrent.values.length
      : 0;
    const row = min([firstRow + rowsWithData - 1, lastRow]) as number;
    const column = lastCellAddress!.replace(`${lastRow}`, "");

    return {
      range: `${sheet}!${column}${row + 1}:${column}${
        row + params.countOfCells
      }`,
      maxRow: row + params.countOfCells,
      sheetTitle: sheet!,
    };
  }

  private mapMessagesUserUpdateToOutgoingEnvelopes(
    params: connector_v1.Params$MapMessagesToEnvelopes<
      hull_v1.Schema$MessageUserUpdate
    >,
  ): connector_v1.Schema$OutgoingOperationEnvelope<
    hull_v1.Schema$MessageUserUpdate,
    unknown
  >[] {
    return params.messages.map((msg) => {
      return {
        hullMessage: msg,
        hullObjectType: "user",
        serviceOperation: "UNSPECIFIED",
      };
    });
  }

  private mapMessagesAccountUpdateToOutgoingEnvelopes(
    params: connector_v1.Params$MapMessagesToEnvelopes<
      hull_v1.Schema$MessageAccountUpdate
    >,
  ): connector_v1.Schema$OutgoingOperationEnvelope<
    hull_v1.Schema$MessageAccountUpdate,
    unknown
  >[] {
    return params.messages.map((msg) => {
      return {
        hullMessage: msg,
        hullObjectType: "account",
        serviceOperation: "UNSPECIFIED",
      };
    });
  }
}
