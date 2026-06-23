import * as React from "react";
import { useState } from "react";
import { ThemeProvider, PartialTheme, createTheme } from "@fluentui/react";
import { AppProvider, useApp } from "../../../context/AppContext";
import { useProcessForm } from "../../../hooks/UseProcessForm";
import { MainLayout } from "../../../layouts/MainLayout";
import { Sidebar, SidebarPageKey } from "../../../layouts/Sidebar";
import { IBpmSystemProps } from "./IBpmSystemProps";
import { LeaveService } from "../../../services/LeaveService";
import { ICreateLeaveInput } from "../../../repositories/LeaveRepository";
import { RequestStatus } from "../../../constants/enums";
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
const leaveService = new LeaveService();

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

  const getFirstNonEmptyValue = (
    source: Record<string, any>,
    keys: string[],
  ): any => {
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return undefined;
  };

  const handleSubmit = async () => {
    const sortedSteps = [...(formConfig?.steps || [])].sort(
      (a, b) => a.StepOrder - b.StepOrder,
    );
    const activeStepId = sortedSteps[0]?.Id;
    const currentRequestFields = activeStepId
      ? formConfig?.fieldConfigsByStep[activeStepId] ||
        formConfig?.commonFieldConfigs ||
        []
      : formConfig?.commonFieldConfigs || [];

    const requestFormData = currentRequestFields.map((field) => ({
      id: field.Id,
      internalName: field.FieldInternalName,
      displayName: field.FieldDisplayName,
      fieldType: field.FieldType,
      value: formData[field.FieldInternalName],
    }));

    const attachmentData = (formData.Attachments || []).map((file: File) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    }));

    const baseFieldsData = {
      reason: formData.Reason || "",
      approver: formData.Approver || "",
      isUrgent: !!formData.IsUrgent,
    };

    const submitPayload = {
      requestForm: requestFormData,
      attachments: attachmentData,
      baseFields: baseFieldsData,
      workflowStatus: workflowSteps,
    };

    console.log("=== DỮ LIỆU GỬI ĐI ===", submitPayload);

    if (!formConfig) {
      console.error("Không có formConfig để submit");
      return;
    }

    const isEmptyRequiredValue = (value: any): boolean => {
      if (value === undefined || value === null) {
        return true;
      }
      if (typeof value === "string") {
        return value.trim() === "";
      }
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return false;
    };

    const missingRequiredFields = currentRequestFields
      .filter(
        (field) =>
          field.IsRequired &&
          isEmptyRequiredValue(formData[field.FieldInternalName]),
      )
      .map((field) => field.FieldDisplayName);

    if (missingRequiredFields.length > 0) {
      const missingText = missingRequiredFields.join(", ");
      alert(`Vui lòng nhập các trường bắt buộc: ${missingText}`);
      console.warn("Thiếu trường bắt buộc:", missingRequiredFields);
      return;
    }

    const titleRaw = getFirstNonEmptyValue(formData, [
      "Title",
      "RequestTitle",
      "Subject",
    ]);
    const absenceTypeRaw = getFirstNonEmptyValue(formData, [
      "AbsenceType",
      "LeaveType",
      "LoaiNghi",
      "Type",
    ]);
    const absenceDatesRaw = getFirstNonEmptyValue(formData, [
      "AbsenceDates",
      "LeaveDates",
      "DateRange",
      "NgayNghi",
    ]);
    const totalDaysRaw = getFirstNonEmptyValue(formData, [
      "TotalDays",
      "SoNgayNghi",
      "Days",
    ]);
    const partialDayRaw = getFirstNonEmptyValue(formData, [
      "PartialDay",
      "BuoiNghi",
      "Session",
    ]);
    const requestReasonRaw = getFirstNonEmptyValue(formData, [
      "RequestReason",
      "LyDo",
      "Reason",
    ]);
    const lateEarlyHoursRaw = getFirstNonEmptyValue(formData, [
      "LateEarlyHours",
      "SoGioDiMuonVeSom",
      "Hours",
    ]);
    const managerIdRaw = getFirstNonEmptyValue(formData, [
      "ManagerId",
      "QuanLyId",
    ]);
    const notifyToIdRaw = getFirstNonEmptyValue(formData, [
      "NotifyToId",
      "ThongBaoChoId",
    ]);

    const toOptionalNumber = (value: any): number | undefined => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const createInput: ICreateLeaveInput = {
      Title: String(titleRaw || ""),
      ProcessIDId: formConfig.process.Id,
      AbsenceType: String(absenceTypeRaw || "Khac"),
      PartialDay: String(partialDayRaw || "FullDay"),
      AbsenceDates: String(absenceDatesRaw || new Date().toISOString()),
      RequestReason: String(requestReasonRaw || baseFieldsData.reason || ""),
      TotalDays: Number(totalDaysRaw ?? 0) || 0,
      ManagerId: toOptionalNumber(managerIdRaw),
      NotifyToId: toOptionalNumber(notifyToIdRaw),
      LateEarlyHours: toOptionalNumber(lateEarlyHoursRaw),
      HistoryStep: workflowSteps,
    };

    try {
      const submitResult = await leaveService.submitLeave(
        createInput,
        formConfig.process.ProcessCode,
      );
      console.log("=== SUBMIT SERVICE RESULT ===", submitResult);
    } catch (error) {
      console.error("Submit thất bại:", error);
    }
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

    const assignedAt = new Date().toISOString();

    return [...(formConfig.steps || [])]
      .sort((a, b) => a.StepOrder - b.StepOrder)
      .map((step, index) => ({
        id: step.Id,
        title: step.Title,
        assigneeId: step.Approver?.Id,
        assignee: step.Approver?.Title || "",
        status: index === 0 ? RequestStatus.Processing : RequestStatus.Pending,
        assignedAt: index === 0 ? assignedAt : undefined,
        completedAt: undefined,
        slaHours: step.SLA_Hours,
        beforeSLA: step.BeforeSLA,
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
