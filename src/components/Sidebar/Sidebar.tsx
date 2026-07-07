import * as React from "react";
import { useState } from "react";
import { Icon } from "@fluentui/react";
import { useApp } from "../../context/AppContext";
import { useSidebarNavigation } from "../../hooks/useSidebarNavigation";
import { INavigationItem } from "../../types/MenuTypes";
import styles from "./Sidebar.module.scss";

const bpmLogoUrl: string = require("../../webparts/bpmSystem/assets/bpmLogo.png");

export interface ISidebarProps {
  selectedItemKey: string;
  onItemSelect: (itemKey: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar = ({
  selectedItemKey,
  onItemSelect,
  isCollapsed,
  onToggleCollapse,
}: ISidebarProps): JSX.Element => {
  const { setSelectedProcess, setIsLoading } = useApp();
  const { navigationGroups, loading } = useSidebarNavigation();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  React.useEffect(() => {
    setExpandedGroups((currentGroups) => {
      const nextGroups: Record<string, boolean> = {};

      navigationGroups.forEach((group) => {
        if (group.items.length > 0) {
          nextGroups[group.key] = currentGroups[group.key] ?? true;
        }
      });

      return nextGroups;
    });
  }, [navigationGroups]);

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
          const hasChildren = group.items.length > 0;
          const processItems: INavigationItem[] = group.items;

          const isExpanded = !!expandedGroups[group.key];

          return (
            <section className={styles.group} key={group.key}>
              <button
                type="button"
                className={styles.groupButton}
                onClick={() => {
                  if (!hasChildren) {
                    onItemSelect(group.key);
                    setSelectedProcess(null, null);
                    return;
                  }

                  handleToggleGroup(group.key);
                }}
                aria-expanded={hasChildren ? isExpanded : undefined}
                title={group.title}
              >
                <span className={styles.groupHeading}>
                  <span className={styles.itemLeading}>
                    <Icon iconName={group.iconName} />
                  </span>
                  <span className={styles.groupTitle}>{group.title}</span>
                </span>
                {hasChildren && (
                  <Icon
                    className={styles.toggleIcon}
                    iconName={isExpanded ? "ChevronDown" : "ChevronRight"}
                  />
                )}
              </button>

              {isExpanded && !isCollapsed && hasChildren && (
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
                        if (item.type === "Process") {
                          if (!item.processId || !item.processCode) {
                            setSelectedProcess(null, null);
                            return;
                          }

                          setSelectedProcess(item.processId, item.processCode);
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
