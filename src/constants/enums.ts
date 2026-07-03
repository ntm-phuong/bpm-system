export enum RequestStatus {
  Draft = "Draft", // Đã lưu (Nháp)
  Pending = "Pending", // Đang xử lý
  Approved = "Approved", // đã duyệt hết tất cả các bước 
  Rejected = "Rejected", // Từ chối
  Revision = "Revision", //yêu cầu chỉnh sửa 
}



export enum StepStatus {
  Pending = "Pending", // Đang xử lý
  Approved = "Approved", // Hoàn thành
  Rejected = "Rejected", // Từ chối
  Skipped = "Skipped", // chuyển bước  (MỚI THÊM)
  Waiting = "Waiting", // Chưa đến (MỚI THÊM)
}

export enum WorkflowAction{
  Submitted = "Submitted", // Đã tạo đơn
  Approved = "Approved", // Đã duyệt
  Rejected = "Rejected", // Từ chối
  Revision = "Revision", // Yêu cầu chỉnh sửa
  Recalled = "Recalled", // Thu hồi
  Forwarded = "Forwarded", // Chuyển tiếp
  Reassigned = "Reassigned", // Giao lại
}


export enum EmployeeRole {
  Staff = "Staff",
  Manager = "Manager",
  Director = "Director",
  HR = "HR",
  Admin = "Admin",
}

export enum FieldType {
  Text = "Text",
  Number = "Number",
  DateTime = "DateTime",
  Choice = "Choice",
  Person = "Person",
  YesNo = "YesNo",
  MultiLine = "MultiLine",
  Dropdown = "Dropdown",
}

