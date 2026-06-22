import * as React from "react";
import { useState } from "react";
import { ThemeProvider, PartialTheme, createTheme } from "@fluentui/react";
import { AppProvider, useApp } from "../../../context/AppContext";
import { useProcessForm } from "../../../hooks/UseProcessForm";
import { MainLayout } from "../../../layouts/MainLayout";
import { Sidebar, SidebarPageKey } from "../../../layouts/Sidebar";
import { IBpmSystemProps } from "./IBpmSystemProps";
import styles from "./BpmSystem.module.scss";

// --- Components ---
import {
  WorkflowStatus,
  IWorkflowStep,
} from "../../../components/WorkflowStatus";
import { RequestForm } from "../../../components/RequestForm";
import { AttachmentPanel } from "../../../components/AttachmentPanel";
import { BaseFields } from "../../../components/BaseFields";


const myTheme: PartialTheme = createTheme({});

const BpmContent: React.FC = () => {
  // Bổ sung lấy selectedProcessCode từ AppContext để truyền cho Submit
  const { selectedProcessId, setIsLoading } = useApp();

  const [selectedPage, setSelectedPage] = useState<SidebarPageKey>("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // --- QUẢN LÝ DỮ LIỆU TỔNG (Single Source of Truth) ---
  const [formData, setFormData] = useState<Record<string, any>>({
    Reason: "",
    Approver: "",
    IsUrgent: false,
    Attachments: [],
  });
  console.log("Form Data hiện tại:", formData);

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    // Reset form về trạng thái ban đầu
    setFormData({
      Reason: "",
      Approver: "",
      IsUrgent: false,
      Attachments: [],
    });
  };

  // --- XỬ LÝ SỰ KIỆN GỬI ĐI VÀ LƯU NHÁP ---
  const handleSaveDraft = () => {
    console.log("Đang lưu nháp dữ liệu:", formData);
    alert("Chức năng lưu nháp đang được phát triển.");
  };

  const handleSubmit = () => {
    console.log("chính khổnh");
  };

  // --- HOOKS ---
  const { formConfig, loading, error } = useProcessForm(
    selectedProcessId ?? undefined,
  );

  React.useEffect(() => {
    setIsLoading(loading);
  }, [loading, setIsLoading]);

  const workflowSteps: IWorkflowStep[] = React.useMemo(() => {
    if (!formConfig) {
      return [];
    }

    return [...(formConfig.steps || [])]
      .sort((a, b) => a.StepOrder - b.StepOrder)
      .map((step, index) => ({
        id: step.Id,
        title: step.Title,
        assignee: step.Approver?.Title || "",
        status: index === 0 ? "processing" : "pending",
      }));
  }, [formConfig]);

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
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f3f2f1",
            minHeight: "100vh",
          }}
        >
          {!selectedProcessId && (
            <div>
              Vui lòng chọn một quy trình ở menu bên trái để tải biểu mẫu.
            </div>
          )}

          {selectedProcessId && loading && (
            <div>Đang tải cấu hình quy trình...</div>
          )}

          {selectedProcessId && !loading && error && (
            <div>Không thể tải cấu hình quy trình: {error}</div>
          )}

          {selectedProcessId && !loading && !error && formConfig && (
            <>
              {/* 1. Timeline trạng thái */}
              <WorkflowStatus steps={workflowSteps} />

              {/* 2. Form động từ SharePoint (Đã bổ sung props) */}
              <RequestForm
                formConfig={formConfig}
                formData={formData}
                onFieldChange={handleFieldChange}
              />

              {/* 3. Panel đính kèm tài liệu */}
              <AttachmentPanel
                files={formData.Attachments || []}
                onFilesChange={(newFiles) =>
                  handleFieldChange("Attachments", newFiles)
                }
              />

              {/* 4. Khối tĩnh & Thanh hành động (Mới được thêm) */}
              <BaseFields
                formData={formData}
                onFieldChange={handleFieldChange}
                onSave={handleSaveDraft}
                onSubmit={handleSubmit}
                onReset={handleReset}
              />
            </>
          )}
        </div>
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
        <BpmContent />
      </AppProvider>
    </ThemeProvider>
  );
};

export default BpmSystem;
