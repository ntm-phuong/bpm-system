import { WorkflowAction } from "../constants/enums";
import { IActionUser } from "./LeaveServiceType";

export interface IRequestActionInput {
  requestId: number;
  action: WorkflowAction;
  currentUser: IActionUser;
  targetUser?: IActionUser;
  comment?: string;
}
