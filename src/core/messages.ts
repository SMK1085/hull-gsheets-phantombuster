export const STATUS_SETUPREQUIRED_NOAPIKEY =
  "Connector unauthenticated: No API Key is present.";

export const STATUS_SETUPREQUIRED_NOCLIENTEMAIL =
  "Connector unauthenticated: Client Email is not present.";
export const STATUS_SETUPREQUIRED_NOPRIVATEKEY =
  "Connector unauthenticated: Private Key is not present.";
export const STATUS_SETUPREQUIRED_NOPRIVATEKEYID =
  "Connector unauthenticated: Private Key ID is not present.";

export const STATUS_SETUPREQUIRED_NOSPREADHSEETID =
  "Connector not fully setup: Spreadsheet ID is not configured.";

export const STATUS_WARNING_NOATTRIBUTE = (objectType: "user" | "account") => {
  return `Misconfiguration for Hull ${objectType}: You have specified segments but no attribute. Go to settings and specify the attribute or remove the segments.`;
};
export const STATUS_WARNING_NORANGE = (objectType: "user" | "account") => {
  return `Misconfiguration for Hull ${objectType}: You have specified segments but no range. Go to settings and specify the range in A1 notion or remove the segments.`;
};

export const ERROR_UNHANDLED_GENERIC = `An unhandled error occurred and our engineering team has been notified.`;

export const VALIDATION_SKIP_HULLOBJECT_NOTINANYSEGMENT = (
  objectType: "user" | "account",
) => {
  return `Hull ${objectType} won't be synchronized since it is not matching any of the filtered segments.`;
};

export const VALIDATION_SKIP_HULLOBJECT_NOVALUEFORATTRIBUTE = (
  objectType: "user" | "account",
  attribName: string,
) => {
  return `Hull ${objectType} won't be synchronized since it has no value for mandatory attribute '${attribName}'.`;
};

export const VALIDATION_SKIP_HULLOBJECT_NOATTRIBUTECONFIGURED = (
  objectType: "user" | "account",
) => {
  return `Hull ${objectType} won't be synchronized since there is no attribute configured. Please check your settings.`;
};

export const VALIDATION_SKIP_HULLOBJECT_ALREADYINSHEET = (
  objectType: "user" | "account",
) => {
  return `Hull ${objectType} won't be synchronized since the data is already present in the spreadsheet.`;
};
