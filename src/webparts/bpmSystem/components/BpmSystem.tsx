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
import { RequestDetailPage } from "../../../pages/RequestDetailPage";

const myTheme: PartialTheme = createTheme({});

const BpmRouter: React.FC<{ context: IBpmSystemProps["context"] }> = ({
  context,
}) => {
  const { selectedProcessId, setCurrentUser } = useApp();

  const [selectedPage, setSelectedPage] = useState<SidebarPageKey>("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const currentUserId = context.pageContext.legacyPageContext.userId;
  const [selectedRequestId, setSelectedRequestId] = useState<number>();

  React.useEffect(() => {
    const user = context.pageContext.legacyPageContext;

    setCurrentUser({
      Id: user.userId,
      Title: user.userDisplayName,
      EMail: user.userEmail,
    });
  }, [context, setCurrentUser]);

  const renderContent = (): JSX.Element | null => {
    if (selectedPage === "requestDetail" && selectedRequestId) {
      return (
        <RequestDetailPage
          requestId={selectedRequestId}
          currentUserId={currentUserId}
          onBack={() => setSelectedPage("myRequests")}
        />
      );
    }
    if (selectedProcessId) {
      return <WorkflowProcess />;
    }

    if (selectedPage === "allRequests") {
      return (
        <RequestListPage
          type="allRequests"
          currentUserId={currentUserId}
          onOpenDetail={(requestId) => {
            setSelectedRequestId(requestId);
            setSelectedPage("requestDetail");
          }}
        />
      );
    }

    if (selectedPage === "myRequests") {
      return (
        <RequestListPage
          type="myRequests"
          currentUserId={currentUserId}
          onOpenDetail={(requestId) => {
            setSelectedRequestId(requestId);
            setSelectedPage("requestDetail");
          }}
        />
      );
    }

    if (selectedPage === "pendingRequests") {
      return (
        <RequestListPage
          type="pendingRequests"
          currentUserId={currentUserId}
          onOpenDetail={(requestId) => {
            setSelectedRequestId(requestId);
            setSelectedPage("requestDetail");
          }}
        />
      );
    }

    if (selectedPage === "processedRequests") {
      return (
        <RequestListPage
          type="processedRequests"
          currentUserId={currentUserId}
          onOpenDetail={(requestId) => {
            setSelectedRequestId(requestId);
            setSelectedPage("requestDetail");
          }}
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
