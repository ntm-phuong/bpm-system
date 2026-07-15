import * as React from "react";
import { useState } from "react";
import { Icon } from "@fluentui/react";
import { useApp } from "../../context/AppContext";
import { useSidebarNavigation } from "../../hooks/useSidebarNavigation";
import { INavigationItem } from "../../types/MenuTypes";
import styles from "./Sidebar.module.scss";

const bpmLogoUrl: string = require(
  "../../webparts/bpmSystem/assets/bpmLogo.png",
);

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

  const { navigationGroups, loading } =
    useSidebarNavigation();

  const [expandedGroups, setExpandedGroups] =
    useState<Record<string, boolean>>({});

  const [isResponsiveMenuOpen, setIsResponsiveMenuOpen] =
    useState<boolean>(false);

  React.useEffect(() => {
    setExpandedGroups((currentGroups) => {
      const nextGroups: Record<string, boolean> = {};

      navigationGroups.forEach((group) => {
        if (group.items.length > 0) {
          nextGroups[group.key] =
            currentGroups[group.key] ?? true;
        }
      });

      return nextGroups;
    });
  }, [navigationGroups]);

  React.useEffect(() => {
    setIsLoading(loading);
  }, [loading, setIsLoading]);

  React.useEffect(() => {
    if (!isResponsiveMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsResponsiveMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return (): void => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isResponsiveMenuOpen]);

  const handleToggleGroup = (
    groupKey: string,
  ): void => {
    setExpandedGroups((currentGroups) => ({
      ...currentGroups,
      [groupKey]: !currentGroups[groupKey],
    }));
  };

  const handleGroupSelect = (
    groupKey: string,
    hasChildren: boolean,
  ): void => {
    if (hasChildren) {
      handleToggleGroup(groupKey);
      return;
    }

    onItemSelect(groupKey);
    setSelectedProcess(null, null);
    setIsResponsiveMenuOpen(false);
  };

  const handleItemSelect = (
    item: INavigationItem,
  ): void => {
    onItemSelect(item.key);

    if (item.type !== "Process") {
      setSelectedProcess(null, null);
      setIsResponsiveMenuOpen(false);
      return;
    }

    if (!item.processId || !item.processCode) {
      setSelectedProcess(null, null);
      setIsResponsiveMenuOpen(false);
      return;
    }

    setSelectedProcess(
      item.processId,
      item.processCode,
    );
    setIsResponsiveMenuOpen(false);
  };

  return (
    <aside
      className={`${styles.sidebar} ${
        isCollapsed ? styles.collapsed : ""
      }`}
      aria-label="BPM sidebar"
    >
      <div
        className={`${styles.logoSection} ${styles.bpmLogo}`}
      >
        <div className={styles.logoWrapper}>
          <img
            className={styles.logoImage}
            src={bpmLogoUrl}
            alt="BPM logo"
          />
        </div>

        <button
          type="button"
          className={styles.desktopCollapseButton}
          aria-label={
            isCollapsed
              ? "Mở rộng sidebar"
              : "Thu gọn sidebar"
          }
          onClick={onToggleCollapse}
        >
          <Icon iconName="GlobalNavButton" />
        </button>

        <button
          type="button"
          className={styles.responsiveMenuButton}
          aria-label={
            isResponsiveMenuOpen
              ? "Đóng menu điều hướng"
              : "Mở menu điều hướng"
          }
          aria-controls="bpm-navigation"
          aria-expanded={isResponsiveMenuOpen}
          onClick={() => {
            setIsResponsiveMenuOpen((currentState) => !currentState);
          }}
        >
          <Icon iconName={isResponsiveMenuOpen ? "Cancel" : "GlobalNavButton"} />
        </button>
      </div>

      <nav
        id="bpm-navigation"
        className={`${styles.navigation} ${
          isResponsiveMenuOpen ? styles.responsiveNavigationOpen : ""
        }`}
      >
        {navigationGroups.map((group) => {
          const hasChildren =
            group.items.length > 0;

          const processItems: INavigationItem[] =
            group.items;

          const isExpanded =
            Boolean(expandedGroups[group.key]);

          const isGroupSelected =
            selectedItemKey === group.key;

          const hasSelectedChild =
            processItems.some(
              (item) =>
                item.key === selectedItemKey,
            );

          const isGroupActive =
            isGroupSelected || hasSelectedChild;

          return (
            <section
              className={styles.group}
              key={group.key}
            >
              <button
                type="button"
                className={`${styles.groupButton} ${
                  isGroupActive
                    ? styles.activeGroupButton
                    : ""
                }`}
                onClick={() =>
                  handleGroupSelect(
                    group.key,
                    hasChildren,
                  )
                }
                aria-expanded={
                  hasChildren
                    ? isExpanded
                    : undefined
                }
                title={group.title}
              >
                <span className={styles.groupHeading}>
                  <span className={styles.itemLeading}>
                    <Icon
                      iconName={group.iconName}
                    />
                  </span>

                  <span className={styles.groupTitle}>
                    {group.title}
                  </span>
                </span>

                {hasChildren && (
                  <Icon
                    className={styles.toggleIcon}
                    iconName={
                      isExpanded
                        ? "ChevronDown"
                        : "ChevronRight"
                    }
                  />
                )}
              </button>

              {isExpanded && hasChildren && (
                  <div className={styles.groupItems}>
                    {group.key ===
                      "createProcess" &&
                      loading && (
                        <span
                          className={
                            styles.groupEmpty
                          }
                        >
                          Đang tải quy trình...
                        </span>
                      )}

                    {group.key ===
                      "createProcess" &&
                      !loading &&
                      processItems.length === 0 && (
                        <span
                          className={
                            styles.groupEmpty
                          }
                        >
                          Không có quy trình đang hoạt
                          động
                        </span>
                      )}

                    {processItems.map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        className={`${
                          styles.childItem
                        } ${
                          selectedItemKey === item.key
                            ? styles.selectedItem
                            : ""
                        }`}
                        onClick={() =>
                          handleItemSelect(item)
                        }
                        title={item.label}
                      >
                        <span
                          className={
                            styles.itemLeading
                          }
                        />

                        <span
                          className={
                            styles.itemLabel
                          }
                        >
                          {item.label}
                        </span>
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