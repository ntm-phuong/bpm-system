import { WorkflowAction } from "../constants/enums";
import { IRequestActionInput } from "../types/RequestActionType";
import { ApproveActionHandler } from "./actions/ApproveActionHandler";
import { RejectActionHandler } from "./actions/RejectActionHandler";
import {ReassignActionHandler} from "./actions/ReassignActionHandler";

export class RequestActionService {
  private _approveHandler = new ApproveActionHandler();
  private _rejectHandler = new RejectActionHandler();
  private _reassignHandler = new ReassignActionHandler();

  async processAction(input: IRequestActionInput) {
    switch (input.action) {
      case WorkflowAction.Approved:
        return this._approveHandler.handle(input);

      case WorkflowAction.Rejected:
        return this._rejectHandler.handle(input);

      case WorkflowAction.Reassigned:
        return this._reassignHandler.handle(input);

      case WorkflowAction.Forwarded:
        throw new Error("Chưa implement Forward.");

      default:
        throw new Error(`Action không hợp lệ: ${input.action}`);
    }
  }
}