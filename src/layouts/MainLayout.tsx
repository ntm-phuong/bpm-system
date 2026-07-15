import * as React from "react";
import styles from "./MainLayout.module.scss";

export interface IMainLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  isSidebarCollapsed?: boolean;
}

export const MainLayout: React.FC<IMainLayoutProps> = ({
  sidebar,
  children,
  isSidebarCollapsed = false,
}) => {
  return (
    <div
      className={`${styles.layout} ${
        isSidebarCollapsed
          ? styles.layoutSidebarCollapsed
          : ""
      }`}
    >
      <div className={styles.sidebarWrapper}>
        {sidebar}
      </div>

      <main className={styles.contentWrapper}>
        {children}
      </main>
    </div>
  );
};