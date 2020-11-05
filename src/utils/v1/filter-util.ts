import { intersection, isNil } from "lodash";
import { connector_v1 } from "../../core/connector.v1";
import { hull_v1 } from "../../core/hull.v1";
import {
  VALIDATION_SKIP_HULLOBJECT_ALREADYINSHEET,
  VALIDATION_SKIP_HULLOBJECT_NOATTRIBUTECONFIGURED,
  VALIDATION_SKIP_HULLOBJECT_NOTINANYSEGMENT,
  VALIDATION_SKIP_HULLOBJECT_NOVALUEFORATTRIBUTE,
} from "../../core/messages";
import { get } from "lodash";

export class FilterUtil {
  public readonly appSettings: connector_v1.Schema$AppSettings;

  constructor(options: connector_v1.Schema$DiRegistrationOptions) {
    this.appSettings = options.hullAppSettings;
  }

  public filterSegments<THullMessage>(
    params: connector_v1.Params$FilterEnvelopesSegment<THullMessage, unknown>,
  ): connector_v1.Schema$OutgoingOperationEnvelope<THullMessage, unknown>[] {
    return params.envelopes.map((envelope) => {
      if (params.isBatch) {
        // Bypass on batch operations
        return envelope;
      } else {
        const whitelistedSegments =
          envelope.hullObjectType === "user"
            ? this.appSettings.user_synchronized_segments
            : this.appSettings.account_synchronized_segments;
        if (
          FilterUtil.isInAnySegment(
            envelope.hullObjectType === "user"
              ? (envelope.hullMessage as any).segments
              : (envelope.hullMessage as any).account_segments,
            whitelistedSegments,
          )
        ) {
          return envelope;
        } else {
          return {
            ...envelope,
            notes: [
              VALIDATION_SKIP_HULLOBJECT_NOTINANYSEGMENT(
                envelope.hullObjectType as any,
              ),
            ],
            hullOperationResult: "skip",
          };
        }
      }
    });
  }

  public filterMandatoryData<THullMessage>(
    params: connector_v1.Params$FilterEnvelopesMandatoryData<
      THullMessage,
      unknown
    >,
  ): connector_v1.Schema$OutgoingOperationEnvelope<THullMessage, unknown>[] {
    return params.envelopes.map((envelope) => {
      const attribName =
        envelope.hullObjectType === "user"
          ? this.appSettings.user_attribute
          : this.appSettings.account_attribute;

      if (isNil(attribName)) {
        return {
          ...envelope,
          notes: [
            ...get(envelope, "notes", []),
            VALIDATION_SKIP_HULLOBJECT_NOATTRIBUTECONFIGURED(
              envelope.hullObjectType as any,
            ),
          ],
          hullOperationResult: "skip",
        };
      }

      const attribVal = get(
        get(envelope, `hullMessage.${envelope.hullObjectType}`, undefined),
        attribName,
        undefined,
      );
      if (isNil(attribVal)) {
        return {
          ...envelope,
          notes: [
            ...get(envelope, "notes", []),
            VALIDATION_SKIP_HULLOBJECT_NOVALUEFORATTRIBUTE(
              envelope.hullObjectType as any,
              attribName,
            ),
          ],
          hullOperationResult: "skip",
        };
      }

      return envelope;
    });
  }

  public filterAlreadyInSheet<THullMessage>(
    params: connector_v1.Params$FilterEnvelopesAlreadyInSheet<
      THullMessage,
      unknown
    >,
  ): connector_v1.Schema$OutgoingOperationEnvelope<THullMessage, unknown>[] {
    return params.envelopes.map((envelope) => {
      const attribName =
        envelope.hullObjectType === "user"
          ? this.appSettings.user_attribute
          : this.appSettings.account_attribute;
      if (isNil(attribName)) {
        return {
          ...envelope,
          notes: [
            ...get(envelope, "notes", []),
            VALIDATION_SKIP_HULLOBJECT_NOATTRIBUTECONFIGURED(
              envelope.hullObjectType as any,
            ),
          ],
          hullOperationResult: "skip",
        };
      }

      const attribVal = get(
        get(envelope, `hullMessage.${envelope.hullObjectType}`, undefined),
        attribName,
        undefined,
      );

      if (params.sheetData.includes(attribVal)) {
        return {
          ...envelope,
          notes: [
            ...get(envelope, "notes", []),
            VALIDATION_SKIP_HULLOBJECT_ALREADYINSHEET(
              envelope.hullObjectType as any,
            ),
          ],
          hullOperationResult: "skip",
        };
      }

      return envelope;
    });
  }

  private static isInAnySegment(
    actualSegments: hull_v1.Schema$Segment[],
    whitelistedSegments: string[],
  ): boolean {
    const actualIds = actualSegments.map((s) => s.id);
    if (intersection(actualIds, whitelistedSegments).length === 0) {
      return false;
    }

    return true;
  }
}
