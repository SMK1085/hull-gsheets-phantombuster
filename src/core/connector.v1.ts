import { sheets_v4 } from "googleapis";
import { hull_v1 } from "./hull.v1";

export namespace connector_v1 {
  export interface Options {
    version: "v1";
  }

  export interface Schema$AppSettings {
    /**
     * The API key from Google-Sheets
     */
    api_key?: string | null;

    /**
     * The spreadsheet id
     */
    spreadsheet_id?: string | null;

    /**
     * The synchronized segments for users
     */
    user_synchronized_segments: string[];

    /**
     * The range in A1 notion for users
     */
    user_range?: string | null;

    /**
     * The attribute to synchronize for users
     */
    user_attribute?: string | null;

    /**
     * The synchronized segments for accounts
     */
    account_synchronized_segments: string[];

    /**
     * The range in A1 notion for accounts
     */
    account_range?: string | null;

    /**
     * The attribute to synchronize for accounts
     */
    account_attribute?: string | null;

    /**
     * The client email of the service account
     */
    auth_client_email?: string | null;

    /**
     * The private key of the service account
     */
    auth_private_key?: string | null;

    /**
     * The private key id of the service account
     */
    auth_private_key_id?: string | null;
  }

  export interface Schema$LogPayload {
    channel: "operational" | "metric" | "error";
    component: string;
    code: string;
    message?: string | null;
    metricKey?: string | null;
    metricValue?: number | null;
    errorDetails?: any | null;
    errorMessage?: string | null;
    appId: string;
    tenantId: string;
    correlationKey?: string;
  }

  export interface Schema$DiRegistrationOptions {
    hullAppSettings: Schema$AppSettings;
  }

  export type Type$ApiMethod =
    | "delete"
    | "get"
    | "GET"
    | "DELETE"
    | "head"
    | "HEAD"
    | "options"
    | "OPTIONS"
    | "post"
    | "POST"
    | "put"
    | "PUT"
    | "patch"
    | "PATCH"
    | "link"
    | "LINK"
    | "unlink"
    | "UNLINK";

  export interface Schema$ApiResult<TPayload, TData, TError> {
    endpoint: string;
    method: Type$ApiMethod;
    payload: TPayload | undefined;
    data?: TData;
    success: boolean;
    error?: string | string[];
    errorDetails?: TError;
  }

  export type Type$ServiceOperation = "UNSPECIFIED" | "WRITE";

  export interface Schema$OutgoingOperationEnvelope<
    THullMessage,
    TServiceObject
  > {
    hullMessage: THullMessage;
    hullObjectType: "user" | "account" | "event";
    hullOperationResult?: "success" | "error" | "skip";
    serviceObject?: TServiceObject;
    serviceOperation: Type$ServiceOperation;
    notes?: string[];
  }

  export interface Params$MapMessagesToEnvelopes<THullMessage> {
    channel: string;
    messages: THullMessage[];
  }

  export interface Params$MapCurrentRangeToInsertRange {
    rangeCurrent: sheets_v4.Schema$ValueRange;
    countOfCells: number;
  }

  export interface Schema$MapCurrentRangeToInsertRange {
    range: string;
    maxRow: number;
    sheetTitle: string;
  }

  export interface Params$FilterEnvelopesSegment<THullMessage, TServiceObject> {
    envelopes: Schema$OutgoingOperationEnvelope<THullMessage, TServiceObject>[];
    isBatch: boolean;
  }

  export interface Params$FilterEnvelopesMandatoryData<
    THullMessage,
    TServiceObject
  > {
    envelopes: Schema$OutgoingOperationEnvelope<THullMessage, TServiceObject>[];
  }

  export interface Params$FilterEnvelopesAlreadyInSheet<
    THullMessage,
    TServiceObject
  > {
    envelopes: Schema$OutgoingOperationEnvelope<THullMessage, TServiceObject>[];
    sheetData: any[];
  }

  export type Type$ConnectorStatus =
    | "ok"
    | "warning"
    | "error"
    | "setupRequired";

  export interface Schema$ConnectorStatusResponse {
    status: Type$ConnectorStatus;
    messages: string[];
  }

  export interface Schema$MapIncomingResult {
    ident: unknown;
    hullScope: "asUser" | "asAccount";
    hullOperation: "traits" | "track" | "alias" | "unalias";
    hullOperationParams: unknown[];
  }
}
