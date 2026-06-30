import * as React from "react";
import { useState } from "react";
import { Icon } from "@fluentui/react";
import { useApp } from "../../context/AppContext";
import { useMenuItems } from "../../hooks/UseMenuItems";
import styles from "./Sidebar.module.scss";

const bpmLogoUrl: string = require("../../webparts/bpmSystem/assets/bpmLogo.png");

export type SidebarPageKey =
  | "home"
  | "profile"
  | "documents"
  | "news"
  | "allRequests"
  | "myRequests"
  | "pendingRequests"
  | "processedRequests"
  | `process-${number}`
  | "requestDetail";


interface INavigationItem {
  key: SidebarPageKey;
  label: string;
}

interface INavigationGroup {
  key: string;
  title: string;
  iconName: string;
  isStandalone?: boolean;
  items: INavigationItem[];
}

export interface ISidebarProps {
  selectedItemKey: SidebarPageKey;
  onItemSelect: (itemKey: SidebarPageKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navigationGroups: INavigationGroup[] = [
  {
    key: "home",
    title: "TRANG CHU",
    iconName: "Home",
    isStandalone: true,
    items: [],
  },
  {
    key: "myInformation",
    title: "THONG TIN CUA TOI",
    iconName: "Contact",
    items: [
      { key: "profile", label: "Profile ca nhan" },
      { key: "documents", label: "Van ban ban hanh" },
      { key: "news", label: "Danh sach tin tuc" },
    ],
  },
  {
    key: "createProcess",
    title: "TAO QUY TRINH",
    iconName: "BulletedList",
    items: [],
  },
  {
    key: "statistical",
    title: "THONG KE",
    iconName: "BarChart",
    items: [
      { key: "allRequests", label: "Tất cả các phiếu" },
      { key: "myRequests", label: "Phiếu đã tạo" },
      { key: "pendingRequests", label: "Phiếu cần xử lý" },
      { key: "processedRequests", label: "Phiếu đã xử lý" },
    ],
  },
];

export const Sidebar = ({
  selectedItemKey,
  onItemSelect,
  isCollapsed,
  onToggleCollapse,
}: ISidebarProps): JSX.Element => {
  const { setSelectedProcess, setIsLoading } = useApp();
  const { menuItems, loading } = useMenuItems();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      myInformation: true,
      createProcess: true,
	  statistical: true,

    },
  );

  const handleToggleGroup = (groupKey: string): void => {
    setExpandedGroups((currentGroups) => ({
      ...currentGroups,
      [groupKey]: !currentGroups[groupKey],
    }));
  };

  React.useEffect(() => {
    setIsLoading(loading);
  }, [loading, setIsLoading]);

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
      aria-label="BPM sidebar"
    >
      <div className={`${styles.logoSection} ${styles.bpmLogo}`}>
        {!isCollapsed && (
          <div className={styles.logoWrapper}>
            <img className={styles.logoImage} src={bpmLogoUrl} alt="BPM logo" />
          </div>
        )}

        <button
          type="button"
          className={styles.menuButton}
          aria-label={isCollapsed ? "Mo rong sidebar" : "Thu gon sidebar"}
          onClick={onToggleCollapse}
        >
          <Icon iconName="GlobalNavButton" />
        </button>
      </div>

      <nav className={styles.navigation}>
        {navigationGroups.map((group) => {
          const processItems: INavigationItem[] =
            group.key === "createProcess"
              ? menuItems.map((process) => ({
                  key: `process-${process.processId}`,
                  label: process.title,
                }))
              : group.items;

          const isExpanded = expandedGroups[group.key];

          return (
            <section className={styles.group} key={group.key}>
              <button
                type="button"
                className={styles.groupButton}
                onClick={() => {
                  if (group.isStandalone) {
                    onItemSelect("home");
                    setSelectedProcess(null, null);
                    return;
                  }

                  handleToggleGroup(group.key);
                }}
                aria-expanded={group.isStandalone ? undefined : isExpanded}
                title={group.title}
              >
                <span className={styles.groupHeading}>
                  <span className={styles.itemLeading}>
                    <Icon iconName={group.iconName} />
                  </span>
                  <span className={styles.groupTitle}>{group.title}</span>
                </span>
                {!group.isStandalone && (
                  <Icon
                    className={styles.toggleIcon}
                    iconName={isExpanded ? "ChevronDown" : "ChevronRight"}
                  />
                )}
              </button>

              {isExpanded && !isCollapsed && !group.isStandalone && (
                <div className={styles.groupItems}>
                  {group.key === "createProcess" && loading && (
                    <span className={styles.groupEmpty}>
                      Dang tai quy trinh...
                    </span>
                  )}
                  {group.key === "createProcess" &&
                    !loading &&
                    processItems.length === 0 && (
                      <span className={styles.groupEmpty}>
                        Khong co quy trinh active
                      </span>
                    )}
                  {processItems.map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      className={`${styles.childItem} ${selectedItemKey === item.key ? styles.selectedItem : ""}`}
                      onClick={() => {
                        onItemSelect(item.key);
                        if (group.key === "createProcess") {
                          const processId = Number(
                            item.key.replace("process-", ""),
                          );
                          const selectedMenuItem = menuItems.find(
                            (process) => process.processId === processId,
                          );
                          if (Number.isNaN(processId) || !selectedMenuItem) {
                            setSelectedProcess(null, null);
                            return;
                          }

                          setSelectedProcess(
                            processId,
                            selectedMenuItem.processCode,
                          );
                        } else {
                          setSelectedProcess(null, null);
                        }
                      }}
                      title={item.label}
                    >
                      <span className={styles.itemLeading}></span>
                      <span className={styles.itemLabel}>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </nav>
    </aside>
  );
};
