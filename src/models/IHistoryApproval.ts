import {WorkflowAction} from "../constants/enums"
export interface IHistoryApproval {
  requestId?: number;

  stepOrder: number;
  stepName: string;

  actorId?: number;
  actorName?: string;
  actorEmail?: string;

    assigneeId?: number | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;


  action: WorkflowAction;

  actionTime: string;
  comment?: string;

}
export const parseHistoryApproval = (
  value?: string | IHistoryApproval[],
): IHistoryApproval[] => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};