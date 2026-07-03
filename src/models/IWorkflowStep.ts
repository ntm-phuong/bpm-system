import { StepStatus, WorkflowAction } from "../constants/enums";
import { mapActionToStepStatus } from "../utils/WorkflowStatusMapper";
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

  action?: WorkflowAction;

  slaHours?: number;
  beforeSLA?: number;
  expectedSLA?: string;
  actualSLA?: number;
  completedSLA?: boolean;
}

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const normalizeStep = (rawInput: unknown, index: number): IWorkflowStep => {
  const raw = toRecord(rawInput);
  const id =
    Number(raw?.stepOrder ?? raw?.id ?? raw?.step ?? index + 1) || index + 1;
  const actionRaw = raw?.action as WorkflowAction | undefined;

  const status =
    (raw?.status as StepStatus | undefined) ??
    (actionRaw ? mapActionToStepStatus(actionRaw) : StepStatus.Waiting);
  return {
    stepOrder: id,
    title: String(raw?.title ?? raw?.stepName ?? `Step ${id}`),
    assigneeId:
      typeof raw?.assigneeId === "number" ? raw.assigneeId : undefined,

    assignee: (raw?.assignee ?? raw?.approver) as string | undefined,
    status,
    assignedAt: raw?.assignedAt as string | undefined,
    completedAt: (raw?.completedAt ?? raw?.actionTime) as string | undefined,
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
