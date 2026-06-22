import * as React from "react";
import { Stack } from "@fluentui/react";
import styles from "./MainLayout.module.scss";

export interface IMainLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  isSidebarCollapsed?: boolean;
}

export const MainLayout = ({
  sidebar,
  children,
  isSidebarCollapsed = false,
}: IMainLayoutProps): JSX.Element => {
  return (
    <Stack horizontal className={styles.layout}>
      <aside
        className={`${styles.sidebarWrapper} ${isSidebarCollapsed ? styles.sidebarCollapsed : ""}`}
        role="navigation"
        aria-label="BPM Navigation"
      >
        <div className="bg-red-400 p-5">{sidebar}</div>
      </aside>

      <main className={styles.contentWrapper}>{children}</main>
    </Stack>
  );
};
