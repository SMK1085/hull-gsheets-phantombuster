import { statusActionFactory } from "./status";
import { accountUpdateHandlerFactory } from "./account-update";
import { userUpdateHandlerFactory } from "./user-update";

export default {
  status: statusActionFactory,
  accountUpdate: accountUpdateHandlerFactory,
  userUpdate: userUpdateHandlerFactory,
};
