import { AwilixContainer, asClass, asValue } from "awilix";
import { ServiceClient } from "./service-client";
import { LoggingUtil } from "../utils/v1/logging-util";
import { FilterUtil } from "../utils/v1/filter-util";
import { MappingUtil } from "../utils/v1/mapping-util";
import { Logger } from "winston";
import IHullClient from "../types/hull-client";
import { isNil, cloneDeep } from "lodash";
import {
  ERROR_UNHANDLED_GENERIC,
  STATUS_WARNING_NOATTRIBUTE,
  STATUS_WARNING_NORANGE,
  STATUS_SETUPREQUIRED_NOSPREADHSEETID,
  STATUS_SETUPREQUIRED_NOCLIENTEMAIL,
  STATUS_SETUPREQUIRED_NOPRIVATEKEY,
  STATUS_SETUPREQUIRED_NOPRIVATEKEYID,
} from "./messages";
import { HullUtil } from "../utils/v1/hull-util";
import { connector_v1 } from "./connector.v1";
import { hull_v1 } from "./hull.v1";

export class SyncAgent {
  public readonly diContainer: AwilixContainer;

  constructor(container: AwilixContainer) {
    this.diContainer = container;
    const connectorSettings = this.diContainer.resolve<
      connector_v1.Schema$AppSettings
    >("hullAppSettings");
    this.diContainer.register(
      "apiKey",
      asValue(connectorSettings.api_key || "unknown"),
    );
    this.diContainer.register("serviceClient", asClass(ServiceClient));
    this.diContainer.register("loggingUtil", asClass(LoggingUtil));
    this.diContainer.register("filterUtil", asClass(FilterUtil));
    this.diContainer.register("mappingUtil", asClass(MappingUtil));
    this.diContainer.register("hullUtil", asClass(HullUtil));
  }

  /**
   * Processes outgoing notifications for user:update lane.
   *
   * @param {hull_v1.Schema$MessageUserUpdate[]} messages The notification messages.
   * @param {boolean} [isBatch=false] `True` if it is a batch; otherwise `false`.
   * @returns {Promise<unknown>} An awaitable Promise.
   * @memberof SyncAgent
   */
  public async sendUserMessages(
    messages: hull_v1.Schema$MessageUserUpdate[],
    isBatch = false,
  ): Promise<void> {
    await this.sendMessages("user:update", messages, isBatch);
  }

  /**
   * Processes outgoing notifications for account:update lane.
   *
   * @param {hull_v1.Schema$MessageAccountUpdate[]} messages The notification messages.
   * @param {boolean} [isBatch=false] `True` if it is a batch; otherwise `false`.
   * @returns {Promise<unknown>} An awaitable Promise.
   * @memberof SyncAgent
   */
  public async sendAccountMessages(
    messages: hull_v1.Schema$MessageAccountUpdate[],
    isBatch = false,
  ): Promise<void> {
    await this.sendMessages("account:update", messages, isBatch);
  }

  /**
   * Determines the overall status of the connector.
   *
   * @returns {Promise<connector_v1.Schema$ConnectorStatusResponse>} The status response.
   * @memberof SyncAgent
   */
  public async determineConnectorStatus(): Promise<
    connector_v1.Schema$ConnectorStatusResponse
  > {
    const logger = this.diContainer.resolve<Logger>("logger");
    const loggingUtil = this.diContainer.resolve<LoggingUtil>("loggingUtil");
    const correlationKey = this.diContainer.resolve<string>("correlationKey");

    const statusResult: connector_v1.Schema$ConnectorStatusResponse = {
      status: "ok",
      messages: [],
    };

    try {
      logger.debug(
        loggingUtil.composeOperationalMessage(
          "OPERATION_CONNECTORSTATUS_START",
          correlationKey,
        ),
      );

      const connectorSettings = this.diContainer.resolve<
        connector_v1.Schema$AppSettings
      >("hullAppSettings");
      const hullClient = this.diContainer.resolve<IHullClient>("hullClient");
      const connectorId = this.diContainer.resolve<string>("hullAppId");

      // Perfom checks to verify setup is complete
      if (isNil(connectorSettings.auth_client_email)) {
        statusResult.status = "setupRequired";
        statusResult.messages.push(STATUS_SETUPREQUIRED_NOCLIENTEMAIL);
      }

      if (isNil(connectorSettings.auth_private_key)) {
        statusResult.status = "setupRequired";
        statusResult.messages.push(STATUS_SETUPREQUIRED_NOPRIVATEKEY);
      }

      if (isNil(connectorSettings.auth_private_key_id)) {
        statusResult.status = "setupRequired";
        statusResult.messages.push(STATUS_SETUPREQUIRED_NOPRIVATEKEYID);
      }

      if (isNil(connectorSettings.spreadsheet_id)) {
        statusResult.status = "setupRequired";
        statusResult.messages.push(STATUS_SETUPREQUIRED_NOSPREADHSEETID);
      }

      if (statusResult.status !== "setupRequired") {
        // Check if segment is specified, but no attribute or range
        if (
          connectorSettings.account_synchronized_segments &&
          connectorSettings.account_synchronized_segments.length !== 0 &&
          isNil(connectorSettings.account_attribute)
        ) {
          statusResult.status = "warning";
          statusResult.messages.push(STATUS_WARNING_NOATTRIBUTE("account"));
        }

        if (
          connectorSettings.account_synchronized_segments &&
          connectorSettings.account_synchronized_segments.length !== 0 &&
          isNil(connectorSettings.account_range)
        ) {
          statusResult.status = "warning";
          statusResult.messages.push(STATUS_WARNING_NORANGE("account"));
        }

        if (
          connectorSettings.user_synchronized_segments &&
          connectorSettings.user_synchronized_segments.length !== 0 &&
          isNil(connectorSettings.user_attribute)
        ) {
          statusResult.status = "warning";
          statusResult.messages.push(STATUS_WARNING_NOATTRIBUTE("user"));
        }

        if (
          connectorSettings.user_synchronized_segments &&
          connectorSettings.user_synchronized_segments.length !== 0 &&
          isNil(connectorSettings.user_range)
        ) {
          statusResult.status = "warning";
          statusResult.messages.push(STATUS_WARNING_NORANGE("user"));
        }
      }

      logger.debug(
        loggingUtil.composeOperationalMessage(
          "OPERATION_CONNECTORSTATUS_STARTHULLAPI",
          correlationKey,
        ),
      );

      await hullClient.put(`${connectorId}/status`, statusResult);

      logger.debug(
        loggingUtil.composeOperationalMessage(
          "OPERATION_CONNECTORSTATUS_SUCCESS",
          correlationKey,
        ),
      );
    } catch (error) {
      console.error(error);
      const logPayload = loggingUtil.composeErrorMessage(
        "OPERATION_CONNECTORSTATUS_UNHANDLED",
        cloneDeep(error),
        correlationKey,
      );
      logger.error(logPayload);
      statusResult.status = "error";
      if (logPayload && logPayload.message) {
        statusResult.messages.push(logPayload.message);
      } else {
        statusResult.messages.push(ERROR_UNHANDLED_GENERIC);
      }
    }

    return statusResult;
  }

  private isSetupComplete(): boolean {
    const appSettings = this.diContainer.resolve<
      connector_v1.Schema$AppSettings
    >("hullAppSettings");

    if (isNil(appSettings.auth_client_email)) {
      return false;
    }

    if (isNil(appSettings.auth_private_key)) {
      return false;
    }

    if (isNil(appSettings.auth_private_key_id)) {
      return false;
    }

    if (isNil(appSettings.spreadsheet_id)) {
      return false;
    }

    return true;
  }

  private async sendMessages<THullMessage>(
    channel: string,
    messages: THullMessage[],
    isBatch: boolean,
  ): Promise<void> {
    const OBJECT_IDENT = channel.startsWith("account:") ? "ACCOUNT" : "USER";
    const logger = this.diContainer.resolve<Logger>("logger");
    const loggingUtil = this.diContainer.resolve<LoggingUtil>("loggingUtil");
    const correlationKey = this.diContainer.resolve<string>("correlationKey");

    try {
      const startMsgId = isBatch
        ? `OPERATION_SEND${OBJECT_IDENT}MESSAGESBATCH_START`
        : `OPERATION_SEND${OBJECT_IDENT}MESSAGES_START`;
      logger.debug(
        loggingUtil.composeOperationalMessage(startMsgId, correlationKey),
      );
      logger.info(
        loggingUtil.composeMetricMessage(
          `OPERATION_SEND${OBJECT_IDENT}MESSAGES_COUNT`,
          correlationKey,
          messages.length,
        ),
      );

      if (this.isSetupComplete() === false) {
        // Return immediately, since we cannot process anything
        logger.debug(
          loggingUtil.composeOperationalMessage(
            `OPERATION_SEND${OBJECT_IDENT}MESSAGES_INVALIDCONFIG`,
            correlationKey,
          ),
        );
        return;
      }

      const mappingUtil = this.diContainer.resolve<MappingUtil>("mappingUtil");
      let envelopes = mappingUtil.mapMessagesToOutgoingEnvelopes({
        messages,
        channel,
      });
      const filterUtil = this.diContainer.resolve<FilterUtil>("filterUtil");
      const hullClient = this.diContainer.resolve<IHullClient>("hullClient");

      envelopes = filterUtil.filterSegments({ envelopes, isBatch });
      envelopes = filterUtil.filterMandatoryData({ envelopes });

      const envelopesToSkip = envelopes.filter(
        (envelope) => envelope.hullOperationResult === "skip",
      );

      envelopesToSkip.forEach((envelope) => {
        let scopedClient;

        if (channel.startsWith("account:")) {
          scopedClient = hullClient.asAccount({
            ...(envelope.hullMessage as any).account,
          });
        } else {
          scopedClient = hullClient.asUser({
            ...(envelope.hullMessage as any).user,
          });
        }

        scopedClient.logger.info(
          `outgoing.${envelope.hullObjectType}.${envelope.hullOperationResult}`,
        );
      });

      if (envelopesToSkip.length === envelopes.length) {
        logger.debug(
          loggingUtil.composeOperationalMessage(
            `OPERATION_SEND${OBJECT_IDENT}MESSAGES_NOOP`,
            correlationKey,
          ),
        );
        return;
      }

      envelopes = envelopes.filter(
        (envelope) => envelope.hullOperationResult !== "skip",
      );

      const serviceClient = this.diContainer.resolve<ServiceClient>(
        "serviceClient",
      );
      const appSettings = this.diContainer.resolve<
        connector_v1.Schema$AppSettings
      >("hullAppSettings");
      // Step 1: Retrieve the range and map it to an array
      logger.info(
        loggingUtil.composeMetricMessage("SERVICE_API_CALL", correlationKey, 1),
      );
      const readRangeResult = await serviceClient.readRange({
        spreadsheetId: appSettings.spreadsheet_id as string,
        range: appSettings.account_range as string,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "SERIAL_NUMBER",
      });

      if (readRangeResult.success === false) {
        logger.error(
          loggingUtil.composeErrorMessage(
            `OPERATION_SEND${OBJECT_IDENT}MESSAGES_GETRANGE`,
            readRangeResult.errorDetails,
            correlationKey,
          ),
        );
        throw new Error(readRangeResult.error as string);
      }

      let rangeValues: any[] = [];
      if (!isNil(readRangeResult.data)) {
        rangeValues = mappingUtil.mapSheetsOneDimensionalValueRangeToArray(
          readRangeResult.data,
        );
      }
      // Step 2: Filter envelopes which have no-op
      envelopes = filterUtil.filterAlreadyInSheet({
        envelopes,
        sheetData: rangeValues,
      });
      envelopes
        .filter((envelope) => envelope.hullOperationResult === "skip")
        .forEach((envelope) => {
          let scopedClient;

          if (channel.startsWith("account:")) {
            scopedClient = hullClient.asAccount({
              ...(envelope.hullMessage as any).account,
            });
          } else {
            scopedClient = hullClient.asUser({
              ...(envelope.hullMessage as any).user,
            });
          }
          scopedClient.logger.info(
            `outgoing.${envelope.hullObjectType}.${envelope.hullOperationResult}`,
            {
              notes: envelope.notes,
            },
          );
        });

      // Step 3: Map service objects
      envelopes = envelopes.filter(
        (envelope) => envelope.hullOperationResult !== "skip",
      );
      let finalEnvelopes = mappingUtil.mapEnvelopesToServiceObjects(envelopes);
      // Step 4: Call G-Sheets API
      const rangeInsert = mappingUtil.mapCurrentRangeToInsertRange({
        countOfCells: finalEnvelopes.length,
        rangeCurrent: readRangeResult.data!,
      });
      logger.info(
        loggingUtil.composeMetricMessage("SERVICE_API_CALL", correlationKey, 1),
      );
      const spreadsheetResult = await serviceClient.getSpreadsheet({
        spreadsheetId: appSettings.spreadsheet_id as string,
      });

      if (spreadsheetResult.success === false) {
        logger.error(
          loggingUtil.composeErrorMessage(
            `OPERATION_SEND${OBJECT_IDENT}MESSAGES_GETSPREADHSHEET`,
            spreadsheetResult.errorDetails,
            correlationKey,
          ),
        );
        throw new Error(spreadsheetResult.error as string);
      }

      const sheetInfo = spreadsheetResult.data!.sheets!.find(
        (s) => s.properties!.title! === rangeInsert.sheetTitle,
      );
      if (
        sheetInfo!.properties!.gridProperties!.rowCount! < rangeInsert.maxRow
      ) {
        logger.debug(
          loggingUtil.composeOperationalMessage(
            `OPERATION_SEND${OBJECT_IDENT}MESSAGES_RESIZESHEET_START`,
            correlationKey,
            `Sheet '${sheetInfo!.properties!.title}' has ${
              sheetInfo!.properties!.gridProperties!.rowCount
            } rows in grid. Insufficient space, appending rows to max of ${
              rangeInsert.maxRow
            }.`,
          ),
        );
        logger.info(
          loggingUtil.composeMetricMessage(
            "SERVICE_API_CALL",
            correlationKey,
            1,
          ),
        );
        const appendResult = await serviceClient.batchUpdate({
          spreadsheetId: appSettings.spreadsheet_id!,
          requestBody: {
            requests: [
              {
                appendDimension: {
                  dimension: "ROWS",
                  length:
                    rangeInsert.maxRow -
                    sheetInfo!.properties!.gridProperties!.rowCount!,
                  sheetId: sheetInfo!.properties!.sheetId!,
                },
              },
            ],
          },
        });

        if (appendResult.success === false) {
          logger.error(
            loggingUtil.composeErrorMessage(
              `OPERATION_SEND${OBJECT_IDENT}MESSAGES_RESIZESHEET`,
              appendResult.errorDetails,
              correlationKey,
            ),
          );
          throw new Error(appendResult.error as string);
        }
      }

      logger.info(
        loggingUtil.composeMetricMessage("SERVICE_API_CALL", correlationKey, 1),
      );
      const writeResult = await serviceClient.writeRange({
        range: rangeInsert.range,
        spreadsheetId: appSettings.spreadsheet_id as string,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          majorDimension: "ROWS",
          range: rangeInsert.range,
          values: finalEnvelopes.map((envelope) => {
            return [envelope.serviceObject];
          }),
        },
      });
      if (writeResult.success === false) {
        logger.error(
          loggingUtil.composeErrorMessage(
            `OPERATION_SEND${OBJECT_IDENT}MESSAGES_WRITERANGE`,
            writeResult.errorDetails,
            correlationKey,
          ),
        );
      }
      // Step 5: Log outgoing result
      finalEnvelopes
        .map((envelope) => {
          return {
            ...envelope,
            notes: writeResult.error,
            hullOperationResult: writeResult.success ? "success" : "error",
          };
        })
        .forEach((envelope) => {
          let scopedClient;

          if (channel.startsWith("account:")) {
            scopedClient = hullClient.asAccount({
              ...(envelope.hullMessage as any).account,
            });
          } else {
            scopedClient = hullClient.asUser({
              ...(envelope.hullMessage as any).user,
            });
          }
          if (writeResult.success) {
            scopedClient.logger.info(
              `outgoing.${envelope.hullObjectType}.${envelope.hullOperationResult}`,
            );
          } else {
            scopedClient.logger.error(
              `outgoing.${envelope.hullObjectType}.${envelope.hullOperationResult}`,
              {
                errorDetails: envelope.notes,
              },
            );
          }
        });
    } catch (error) {
      const logPayload = loggingUtil.composeErrorMessage(
        `OPERATION_SEND${OBJECT_IDENT}MESSAGES_UNHANDLED`,
        cloneDeep(error),
        correlationKey,
      );
      logger.error(logPayload);
    }

    return Promise.resolve();
  }
}
