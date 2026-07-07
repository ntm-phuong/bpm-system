import { useEffect, useState } from "react";
import { MenuService } from "../services/MenuService";
import { ProcessService } from "../services/ProcessService";
import { INavigationGroup } from "../types/MenuTypes";

const menuService = new MenuService();
const processService = new ProcessService();

const menuIcons: Record<string, string> = {
  home: "Home",
  myInformation: "Contact",
  createProcess: "BulletedList",
  statistical: "BarChart",
  admin: "Settings",
};

export const useSidebarNavigation = (): {
  navigationGroups: INavigationGroup[];
  loading: boolean;
  error?: string;
} => {
  const [navigationGroups, setNavigationGroups] = useState<INavigationGroup[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isCancelled = false;

    const fetchSidebar = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(undefined);

        const [groups, menuItems, processItems] = await Promise.all([
          menuService.getActiveMenuGroups(),
          menuService.getActiveMenuItems(),
          processService.getMenuItems(),
        ]);

        const result: INavigationGroup[] = groups.map((group) => {
          if (group.MenuCode === "createProcess") {
            return {
              key: group.MenuCode,
              title: group.Title,
              iconName: menuIcons[group.MenuCode] ?? "BulletedList",
              items: processItems.map((process) => ({
                key: `process-${process.processId}`,
                label: process.title,
                type: "Process",
                processId: process.processId,
                processCode: process.processCode,
              })),
            };
          }

          return {
            key: group.MenuCode,
            title: group.Title,
            iconName: menuIcons[group.MenuCode] ?? "BulletedList",
            items: menuItems
              .filter((item) => item.Menu?.Id === group.Id)
              .map((item) => ({
                key: item.ItemCode,
                label: item.Title,
                type: "Menu",
              })),
          };
        });

        if (!isCancelled) {
          setNavigationGroups(result);
        }
      } catch (e) {
        if (!isCancelled) {
          setError(e instanceof Error ? e.message : "Khong the tai sidebar");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchSidebar().catch(() => undefined);

    return (): void => {
      isCancelled = true;
    };
  }, []);

  return { navigationGroups, loading, error };
};
