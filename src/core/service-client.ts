import { connector_v1 } from "./connector.v1";
import { google, sheets_v4 } from "googleapis";
import { GaxiosError } from "gaxios";
import { ApiUtil } from "../utils/v1/api-util";

export class ServiceClient {
  public readonly appSettings: connector_v1.Schema$AppSettings;
  private readonly sheetsService: sheets_v4.Sheets;

  /**
   * Initializes a new instance of ServiceClient with the given DI options.
   * @param options The dependency injection options
   */
  constructor(options: connector_v1.Schema$DiRegistrationOptions) {
    this.appSettings = options.hullAppSettings;
    const sanitizedPrivateKey = this.appSettings
      .auth_private_key!.split("\\n")
      .join("\n");

    this.sheetsService = new sheets_v4.Sheets({
      auth: new google.auth.JWT({
        email: this.appSettings.auth_client_email as string,
        key: sanitizedPrivateKey,
        keyId: this.appSettings.auth_private_key_id as string,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      }),
    });
  }

  /**
   * Reads the values for a given single range.
   * @param params The parameters for retrieving values.
   */
  public async readRange(
    params: sheets_v4.Params$Resource$Spreadsheets$Values$Get,
  ): Promise<
    connector_v1.Schema$ApiResult<
      sheets_v4.Params$Resource$Spreadsheets$Values$Get,
      sheets_v4.Schema$ValueRange,
      GaxiosError
    >
  > {
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/values/${params.range}`;
    const method: connector_v1.Type$ApiMethod = "get";

    try {
      const response = await this.sheetsService.spreadsheets.values.get(params);
      return ApiUtil.handleApiResultSuccess(url, method, params, response.data);
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, params, error);
    }
  }

  /**
   * Writes values into a given single range.
   * @param params The parameters for writing values.
   */
  public async writeRange(
    params: sheets_v4.Params$Resource$Spreadsheets$Values$Update,
  ): Promise<
    connector_v1.Schema$ApiResult<
      sheets_v4.Params$Resource$Spreadsheets$Values$Update,
      sheets_v4.Schema$UpdateValuesResponse,
      GaxiosError
    >
  > {
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/values/${params.range}`;
    const method: connector_v1.Type$ApiMethod = "put";

    try {
      const response = await this.sheetsService.spreadsheets.values.update(
        params,
      );
      return ApiUtil.handleApiResultSuccess(url, method, params, response.data);
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, params, error);
    }
  }

  /**
   * Get the information about the given spreadsheet.
   * @param params The parameters for the spreadsheet to retrieve.
   */
  public async getSpreadsheet(
    params: sheets_v4.Params$Resource$Spreadsheets$Get,
  ): Promise<
    connector_v1.Schema$ApiResult<
      sheets_v4.Params$Resource$Spreadsheets$Get,
      sheets_v4.Schema$Spreadsheet,
      GaxiosError
    >
  > {
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}`;
    const method: connector_v1.Type$ApiMethod = "get";

    try {
      const response = await this.sheetsService.spreadsheets.get(params);
      return ApiUtil.handleApiResultSuccess(url, method, params, response.data);
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, params, error);
    }
  }

  public async batchUpdate(
    params: sheets_v4.Params$Resource$Spreadsheets$Batchupdate,
  ): Promise<
    connector_v1.Schema$ApiResult<
      sheets_v4.Params$Resource$Spreadsheets$Batchupdate,
      sheets_v4.Schema$BatchUpdateSpreadsheetResponse,
      GaxiosError
    >
  > {
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}:batchUpdate`;
    const method: connector_v1.Type$ApiMethod = "post";

    try {
      const response = await this.sheetsService.spreadsheets.batchUpdate(
        params,
      );
      return ApiUtil.handleApiResultSuccess(url, method, params, response.data);
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, params, error);
    }
  }
}
