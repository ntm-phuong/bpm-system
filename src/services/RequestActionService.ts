import { WorkflowAction } from "../constants/enums";
import { IRequestActionInput } from "../types/RequestActionType";
import { ApproveActionHandler } from "./actions/ApproveActionHandler";
import { RejectActionHandler } from "./actions/RejectActionHandler";

export class RequestActionService {
  private _approveHandler = new ApproveActionHandler();
  private _rejectHandler = new RejectActionHandler();

  async processAction(input: IRequestActionInput) {
    switch (input.action) {
      case WorkflowAction.Approved:
        return this._approveHandler.handle(input);

      case WorkflowAction.Rejected:
        return this._rejectHandler.handle(input);

      case WorkflowAction.Reassigned:
        throw new Error("Chưa implement Reassign.");

      case WorkflowAction.Forwarded:
        throw new Error("Chưa implement Forward.");

      default:
        throw new Error(`Action không hợp lệ: ${input.action}`);
    }
  }
}