export interface IHistoryApproval {
  requestId?: number;

  stepOrder: number;
  stepName: string;

  approverId?: number;
  approverName?: string;
  approverEmail?: string;

  action: "Submitted" | "Approved" | "Rejected" | "Recalled" | "Forwarded";// chỉnh sửa 


  actionTime: string;
}