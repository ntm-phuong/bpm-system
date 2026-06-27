import * as React from "react";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useProcessForm } from "../hooks/UseProcessForm";
import { LeaveService } from "../services/LeaveService";
import { ICreateLeaveInput } from "../repositories/LeaveRepository";
import { StepStatus } from "../constants/enums";
import { IWorkflowStep } from "../models";

import { WorkflowStatus } from "../components/WorkflowStatus/WorkflowStatus";
import { RequestForm } from "../components/RequestForm/RequestForm";
import { AttachmentPanel } from "../components/AttachmentPanel/AttachmentPanel";
import { BaseFields } from "../components/BaseFields/BaseFields";

const leaveService = new LeaveService();

export const WorkflowProcess: React.FC = () => {
  const { selectedProcessId, setIsLoading, currentUser } = useApp();

  const [formData, setFormData] = useState<Record<string, any>>({
    Reason: "",
    IsUrgent: false,
    Attachments: [],
  });

  const { formConfig, loading, error } = useProcessForm(
    selectedProcessId ?? undefined
  );

  React.useEffect(() => {
    setIsLoading(loading);
  }, [loading, setIsLoading]);

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setFormData({
      Reason: "",
      IsUrgent: false,
      Attachments: [],
    });
  };

  const handleSaveDraft = () => {
    console.log("Đang lưu nháp dữ liệu:", formData);
    alert("Chức năng lưu nháp đang được phát triển.");
  };

  const getFirstNonEmptyValue = (
    source: Record<string, any>,
    keys: string[]
  ): any => {
    for (const key of keys) {
      const value = source[key];

      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }

    return undefined;
  };

  const toOptionalNumber = (value: any): number | undefined => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const isEmptyRequiredValue = (value: any): boolean => {
    if (value === undefined || value === null) return true;
    if (typeof value === "string") return value.trim() === "";
    if (Array.isArray(value)) return value.length === 0;
    return false;
  };

  const handleSubmit = async () => {
    if (!formConfig) return;

    if (!currentUser?.Id) {
      alert("Không xác định được người dùng hiện tại.");
      return;
    }

    const sortedSteps = [...(formConfig.steps || [])].sort(
      (a, b) => a.StepOrder - b.StepOrder
    );

    const activeStepId = sortedSteps[0]?.Id;

    const currentRequestFields = activeStepId
      ? formConfig.fieldConfigsByStep[activeStepId] ||
        formConfig.commonFieldConfigs ||
        []
      : formConfig.commonFieldConfigs || [];

    const missingRequiredFields = currentRequestFields
      .filter(
        field =>
          field.IsRequired &&
          isEmptyRequiredValue(formData[field.FieldInternalName])
      )
      .map(field => field.FieldDisplayName);

    if (missingRequiredFields.length > 0) {
      alert(
        `Vui lòng nhập các trường bắt buộc: ${missingRequiredFields.join(", ")}`
      );
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

    const createInput: ICreateLeaveInput = {
      Title: String(titleRaw || ""),
      ProcessIDId: formConfig.process.Id,

      RequesterId: currentUser.Id,
      RequesterName: currentUser.Title,
      RequesterEmail: currentUser.EMail,

      AbsenceType: String(absenceTypeRaw || "Khac"),
      PartialDay: String(partialDayRaw || "FullDay"),
      AbsenceDates: String(absenceDatesRaw || new Date().toISOString()),
      RequestReason: String(requestReasonRaw || formData.Reason || ""),
      TotalDays: Number(totalDaysRaw ?? 0) || 0,

      ManagerId: toOptionalNumber(managerIdRaw),
      NotifyToId: toOptionalNumber(notifyToIdRaw),
      LateEarlyHours: toOptionalNumber(lateEarlyHoursRaw),

      department: String(formData.Department || ""),
      isEmergency: Boolean(formData.IsUrgent),
    };

    try {
      setIsLoading(true);

      const submitResult = await leaveService.submitLeave(createInput);

      alert(`Nộp đơn thành công! Chuyển tới: ${submitResult.nextApproverName}`);

      handleReset();
    } catch (error: any) {
      console.error("Submit thất bại chi tiết:", error);

      const errorMessage = error?.message || String(error);

      alert(`Nộp đơn thất bại: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const workflowSteps: IWorkflowStep[] = React.useMemo(() => {
    if (!formConfig) return [];

    const now = new Date().toISOString();

    return [...(formConfig.steps || [])]
      .sort((a, b) => a.StepOrder - b.StepOrder)
      .map((step, index) => {
        const isRequesterStep = step.StepOrder === 1;

        return {
          stepOrder: step.StepOrder,
          title: step.Title,

          assigneeId: isRequesterStep
            ? currentUser?.Id ?? null
            : step.StepApproverId ?? null,

          assignee: isRequesterStep
            ? currentUser?.Title || "Requester"
            : step.StepApprover?.Title ?? null,

          assigneeEmail: isRequesterStep
            ? currentUser?.EMail ?? null
            : step.StepApprover?.EMail ?? null,

          isRequesterStep,
          isApprovalStep: !isRequesterStep,

          status: index === 0 ? StepStatus.Pending : StepStatus.Waiting,

          assignedAt: index === 0 ? now : null,
          completedAt: null,

          slaHours: step.SLA_Hours,
          beforeSLA: step.BeforeSLA,
        };
      });
  }, [formConfig, currentUser]);

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải cấu hình quy trình...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        Không thể tải cấu hình quy trình: {error}
      </div>
    );
  }

  if (!formConfig) return null;

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f3f2f1",
        minHeight: "100vh",
      }}
    >
      <WorkflowStatus steps={workflowSteps} />

      <RequestForm
        formConfig={formConfig}
        formData={formData}
        onFieldChange={handleFieldChange}
      />

      <AttachmentPanel
        files={formData.Attachments || []}
        onFilesChange={newFiles =>
          handleFieldChange("Attachments", newFiles)
        }
      />

      <BaseFields
        formData={formData}
        onFieldChange={handleFieldChange}
        onSave={handleSaveDraft}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />
    </div>
  );
};