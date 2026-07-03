import { RequestStatus, StepStatus, WorkflowAction } from "../constants/enums";
export const mapActionToStepStatus = (action: WorkflowAction): StepStatus => {
  switch (action) {
    case WorkflowAction.Submitted:
    case WorkflowAction.Approved:
      return StepStatus.Approved;
    case WorkflowAction.Rejected:
      return StepStatus.Rejected;
    case WorkflowAction.Forwarded:
      return StepStatus.Skipped;
    case WorkflowAction.Revision:
    case WorkflowAction.Reassigned:
      return StepStatus.Pending;
    case WorkflowAction.Recalled:
    default:
      return StepStatus.Waiting;
  }
};
export const mapActionToRequestStatus = (
  action: WorkflowAction,
  isFinalStep = false,
): RequestStatus => {
  switch (action) {
    case WorkflowAction.Submitted:
    case WorkflowAction.Reassigned:
    case WorkflowAction.Forwarded:
      return RequestStatus.Pending;
    case WorkflowAction.Approved:
      return isFinalStep ? RequestStatus.Approved : RequestStatus.Pending;
    case WorkflowAction.Rejected:
      return RequestStatus.Rejected;
    case WorkflowAction.Revision:
      return RequestStatus.Revision;
    case WorkflowAction.Recalled:
      return RequestStatus.Draft;
    default:
      return RequestStatus.Pending;
  }
};
