import {  StepStatus } from "../constants/enums";

export interface IWorkflowStep {
  stepOrder: number;
  title: string;

  assigneeId?: number | null;
  assignee?: string | null;
  assigneeEmail?: string | null;

  isRequesterStep?: boolean;
  isApprovalStep?: boolean;

  status: StepStatus;

  assignedAt?: string | null;
  completedAt?: string | null;

  action?: string;

  slaHours?: number;
  beforeSLA?: number;
  expectedSLA?: string;
  actualSLA?: number;
  completedSLA?: boolean;
}

const mapActionToStatus = (action?: string): StepStatus => {
  switch ((action || "").toLowerCase()) {
    case "approved":
      return StepStatus.Approved;
    case "rejected":
      return StepStatus.Rejected;
    case "revision":
      return StepStatus.Rejected; // hoặc thêm StepStatus.Revision nếu muốn rõ hơn
    case "forwarded":
      return StepStatus.Skipped;
    default:
      return StepStatus.Waiting;
  }
};

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const normalizeStep = (rawInput: unknown, index: number): IWorkflowStep => {
  const raw = toRecord(rawInput);
  const id = Number(raw?.id ?? raw?.step ?? index + 1) || index + 1;
  const actionRaw = raw?.action as string | undefined;

  const status = (raw?.status as StepStatus | undefined) ?? mapActionToStatus(actionRaw);

  return {
    stepOrder: id,
    title: String(raw?.title ?? raw?.stepName ?? `Step ${id}`),
    assigneeId: typeof raw?.assigneeId === "number" ? raw.assigneeId : undefined,
    
    // Ép kiểu các trường còn lại về string | undefined
    assignee: (raw?.assignee ?? raw?.approver) as string | undefined,
    status,
    assignedAt: raw?.assignedAt as string | undefined,
    completedAt: (raw?.completedAt ?? raw?.actionTime) as string | undefined,
    // comment: raw?.comment as string | undefined,
    action: actionRaw,
    
    slaHours: typeof raw?.slaHours === "number" ? raw.slaHours : undefined,
    beforeSLA: typeof raw?.beforeSLA === "number" ? raw.beforeSLA : undefined,
  };
};

export const parseHistorySteps = (
  historyInput?: string | IWorkflowStep[],
): IWorkflowStep[] => {
  if (!historyInput) return [];

  if (Array.isArray(historyInput)) {
    return historyInput.map(normalizeStep);
  }

  try {
    const parsed = JSON.parse(historyInput);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).map(normalizeStep);
  } catch {
    return [];
  }
};
