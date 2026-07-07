import { LISTS } from "../constants/lists";
import { getSP } from "../config/pnpConfig";
import { IMenuGroup, IMenuItem } from "../types/MenuTypes";

interface IMenuGroupRaw {
	Id: number;
	Title: string;
	MenuCode: string;
	Order?: number;
	IsActive: boolean;
}

interface ILookupMenuRaw {
	Id?: number;
	Title?: string;
	MenuCode?: string;
}

interface IAllowedUserRaw {
	Id?: number;
	Title?: string;
	EMail?: string;
}

interface IMenuItemRaw {
	Id: number;
	Title: string;
	ItemCode: string;
	IsActive: boolean;
	Menu?: ILookupMenuRaw;
	AllowedUsers?: IAllowedUserRaw[];
}

const MENU_GROUP_SELECT = [
	"Id",
	"Title",
	"MenuCode",
    "Order",
	"IsActive",
] as const;

const MENU_ITEM_SELECT = [
	"Id",
	"Title",
	"ItemCode",
	"IsActive",
	"MenuId",
	"Menu/Id",
	"Menu/Title",
	"Menu/MenuCode",
	"AllowedUsers/Id",
	"AllowedUsers/Title",
	"AllowedUsers/EMail",
] as const;

const MENU_ITEM_EXPAND = ["Menu", "AllowedUsers"] as const;

export class MenuService {
	async getActiveMenuGroups(): Promise<IMenuGroup[]> {
		try {
			const sp = getSP();
			const items = await sp.web.lists
				.getByTitle(LISTS.MENU_GROUP)
				.items.select(...MENU_GROUP_SELECT)
				.filter("IsActive eq 1")
				.orderBy("Order", true)();

			return (items as IMenuGroupRaw[]).map((item) => ({
				Id: item.Id,
				Title: item.Title,
				MenuCode: item.MenuCode,
                Order: item.Order ?? 0,
				IsActive: item.IsActive,
			}));
		} catch (e) {
			throw this._wrapError(e, "getActiveMenuGroups");
		}
	}

	async getActiveMenuItems(): Promise<IMenuItem[]> {
		try {
			const sp = getSP();
			const items = await sp.web.lists
				.getByTitle(LISTS.MENU_ITEMS)
				.items.select(...MENU_ITEM_SELECT)
				.expand(...MENU_ITEM_EXPAND)
				.filter("IsActive eq 1")
				.orderBy("Title", true)();

			return (items as IMenuItemRaw[]).map((item) => {
				const menu = item.Menu;
				const allowedUsersRaw = item.AllowedUsers ?? [];

				return {
					Id: item.Id,
					Title: item.Title,
					ItemCode: item.ItemCode,
					IsActive: item.IsActive,
					Menu: menu?.Id
						? {
								Id: menu.Id,
								Title: menu.Title ?? "",
								MenuCode: menu.MenuCode ?? "",
							}
						: undefined,
					AllowedUsers: allowedUsersRaw
						.filter((user) => !!user?.Id)
						.map((user) => ({
							Id: user.Id as number,
							Title: user.Title ?? "",
							EMail: user.EMail,
						})),
				} as IMenuItem;
			});
		} catch (e) {
			throw this._wrapError(e, "getActiveMenuItems");
		}
	}

	private _wrapError(e: unknown, method: string): Error {
		const msg = e instanceof Error ? e.message : String(e);
		return new Error(`[MenuService.${method}] ${msg}`);
	}
}
