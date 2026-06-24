import * as React from "react";
import { useState } from "react";
import { ThemeProvider, PartialTheme, createTheme } from "@fluentui/react";
import { AppProvider, useApp } from "../../../context/AppContext";
import { MainLayout } from "../../../layouts/MainLayout";
import { Sidebar, SidebarPageKey } from "../../../components/Sidebar/Sidebar";
import { IBpmSystemProps } from "./IBpmSystemProps";
import styles from "./BpmSystem.module.scss";

// --- Import các Trang (Pages) ---
import { WorkflowProcess } from "../../../pages/WorkflowProcessPage";

const myTheme: PartialTheme = createTheme({});

const BpmRouter: React.FC = () => {
  // Lấy selectedProcessId từ AppContext để biết người dùng có đang chọn quy trình nào không
  const { selectedProcessId } = useApp();
  
  const [selectedPage, setSelectedPage] = useState<SidebarPageKey>("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // --- LOGIC ĐIỀU HƯỚNG (ROUTING) ---
  const renderContent = () => {
    // 1. Nếu người dùng chọn một Quy trình cụ thể từ Sidebar -> Hiển thị trang WorkflowProcess
    if (selectedProcessId) {
      return <WorkflowProcess />;
    }

    // 2. Nếu không có quy trình nào được chọn (Trang chủ mặc định)
    if (selectedPage === "home") {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#605e5c" }}>
          <h2>Chào mừng đến với Hệ thống BPM</h2>
          <p>Vui lòng chọn một quy trình ở menu bên trái để bắt đầu.</p>
        </div>
      );
    }

    // Tương lai bạn có thể thêm các trang khác vào đây:
    // if (selectedPage === "myTasks") return <MyTasksDashboard />;
    
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
      <section className={styles.bpmSystem}>
        {renderContent()}
      </section>
    </MainLayout>
  );
};

const BpmSystem: React.FC<IBpmSystemProps> = ({
  description,
  userDisplayName,
  context,
}) => {
  return (
    <ThemeProvider theme={myTheme}>
      <AppProvider>
        <BpmRouter />
      </AppProvider>
    </ThemeProvider>
  );
};

export default BpmSystem;