export enum RequestStatus {
  Draft = "Draft", // Đã lưu (Nháp)
  Pending = "Pending", // Đang xử lý
  Approved = "Approved", // Hoàn thành
  Rejected = "Rejected", // Từ chối
  Revision = "Revision", // Yêu cầu chỉnh sửa (MỚI THÊM)
}

export enum StepStatus {
  Pending = "Pending", // Đang xử lý
  Approved = "Approved", // Hoàn thành
  Rejected = "Rejected", // Từ chối
  Forwarded = "Forwarded", // Chuyển bước
  Revision = "Revision", // Yêu cầu chỉnh sửa (MỚI THÊM)
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

