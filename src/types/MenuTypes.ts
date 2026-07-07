export type NavigationItemType = "Menu" | "Process";

export interface IMenuGroup {
  Id: number;
  Title: string;
  MenuCode: string;
  Order?: number;
  IsActive: boolean;
}

export interface IMenuItem {
  Id: number;
  Title: string;
  ItemCode: string;
//   Order?: number;
  IsActive: boolean;
  Menu?: {
    Id: number;
    Title: string;
    MenuCode: string;
  };
  AllowedUsers?: {
    Id: number;
    Title: string;
    EMail?: string;
  }[];
}

export interface INavigationItem {
  key: string;
  label: string;
  type: NavigationItemType;

  processId?: number;
  processCode?: string;
}

export interface INavigationGroup {
  key: string;
  title: string;
  iconName: string;
  items: INavigationItem[];
}