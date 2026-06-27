import * as React from "react";
import { useState } from "react";
import { ThemeProvider, PartialTheme, createTheme } from "@fluentui/react";
import { AppProvider, useApp } from "../../../context/AppContext";
import { MainLayout } from "../../../layouts/MainLayout";
import { Sidebar, SidebarPageKey } from "../../../components/Sidebar/Sidebar";
import { IBpmSystemProps } from "./IBpmSystemProps";
import styles from "./BpmSystem.module.scss";
import { RequestListPage } from "../../../pages/RequestListPage";
import { WorkflowProcess } from "../../../pages/WorkflowProcessPage";

const myTheme: PartialTheme = createTheme({});

const BpmRouter: React.FC<{ context: IBpmSystemProps["context"] }> = ({
  context,
}) => {
  const { selectedProcessId, setCurrentUser } = useApp();

  const [selectedPage, setSelectedPage] = useState<SidebarPageKey>("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useState<boolean>(false);

  const currentUserId = context.pageContext.legacyPageContext.userId;

  React.useEffect(() => {
    const user = context.pageContext.legacyPageContext;

    setCurrentUser({
      Id: user.userId,
      Title: user.userDisplayName,
      EMail: user.userEmail,
    });
  }, [context, setCurrentUser]);

  const renderContent = (): JSX.Element | null => {
    if (selectedProcessId) {
      return <WorkflowProcess />;
    }

    if (selectedPage === "allRequests") {
      return (
        <RequestListPage
          type="allRequests"
          currentUserId={currentUserId}
        />
      );
    }

    if (selectedPage === "myRequests") {
      return (
        <RequestListPage
          type="myRequests"
          currentUserId={currentUserId}
        />
      );
    }

    if (selectedPage === "pendingRequests") {
      return (
        <RequestListPage
          type="pendingRequests"
          currentUserId={currentUserId}
        />
      );
    }

    if (selectedPage === "processedRequests") {
      return (
        <RequestListPage
          type="processedRequests"
          currentUserId={currentUserId}
        />
      );
    }

    if (selectedPage === "home") {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#605e5c" }}>
          <h2>Chào mừng đến với Hệ thống BPM</h2>
          <p>Vui lòng chọn một quy trình ở menu bên trái để bắt đầu.</p>
        </div>
      );
    }

    return null;
  };

  return (
    <MainLayout
      isSidebarCollapsed={isSidebarCollapsed}
      sidebar={
        <Sidebar
          selectedItemKey={selectedPage}
          onItemSelect={setSelectedPage}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
        />
      }
    >
      <section className={styles.bpmSystem}>{renderContent()}</section>
    </MainLayout>
  );
};

const BpmSystem: React.FC<IBpmSystemProps> = ({ context }) => {
  return (
    <ThemeProvider theme={myTheme}>
      <AppProvider>
        <BpmRouter context={context} />
      </AppProvider>
    </ThemeProvider>
  );
};

export default BpmSystem;