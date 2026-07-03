import { WorkflowAction } from "../constants/enums";

export interface IActionUser {
  Id: number;
  Title?: string;
  EMail?: string;
}

export interface IRequestActionInput {
  requestId: number;
  action: WorkflowAction;
  currentUser: IActionUser;
  comment?: string;

  targetUserId?: number;
  targetUserName?: string;
  targetUserEmail?: string;
}