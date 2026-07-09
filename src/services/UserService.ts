import { WebPartContext } from "@microsoft/sp-webpart-base";
import { spfi, SPFx, SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import { IPerson } from "../models";

export class UserService {
  private _sp: SPFI;

  constructor(context: WebPartContext) {
    this._sp = spfi().using(SPFx(context));
  }

  async searchUsers(keyword: string, limit = 20): Promise<IPerson[]> {
    return this.searchUser(keyword, limit);
  }

  async searchUser(keyword: string, limit = 20): Promise<IPerson[]> {
    const term = keyword.trim().toLowerCase();

    if (!term) {
      return [];
    }

    const users = await this._sp.web.siteUsers();

    return users
      .filter((user) => {
        const title = user.Title?.toLowerCase() ?? "";
        const email = user.Email?.toLowerCase() ?? "";
        const loginName = user.LoginName?.toLowerCase() ?? "";

        return (
          !!user.Email &&
          !user.IsHiddenInUI &&
          (
            title.includes(term) ||
            email.includes(term) ||
            loginName.includes(term)
          )
        );
      })
      .slice(0, limit)
      .map((user) => ({
        Id: user.Id,
        Title: user.Title,
        EMail: user.Email,
      }));
  }
}