import { RequestStatus } from "../../../constants/enums";

export const REQUEST_STATUS_OPTIONS: RequestStatus[] = [
  RequestStatus.Pending,
  RequestStatus.Approved,
  RequestStatus.Rejected,
  RequestStatus.Revision,
  RequestStatus.Draft,
];
