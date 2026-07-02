import { SPFI, spfi } from "@pnp/sp";
import { SPFx } from "@pnp/sp";
import "@pnp/sp/items";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/attachments";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";

import type { ISPFXContext } from "@pnp/sp";

let _sp: SPFI;

export const initPnP = (context: ISPFXContext): void => {
  if (!_sp) {
    _sp = spfi().using(SPFx(context));
  }
};

export const getSP = (): SPFI => {
  if (!_sp) {
    throw new Error(
      "PnP has not been initialized. Call initPnP(context) first."
    );
  }

  return _sp;
};