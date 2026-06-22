// 1. Giao diện định nghĩa 1 dòng lịch sử duyệt
export interface IStepHistory {
  step: number;        // Thứ tự bước (Ví dụ: 1, 2)
  stepName: string;    // Tên bước (Ví dụ: "Trưởng bộ phận phê duyệt")
  approver: string;    // Tên hoặc Email của người đã xử lý
  action: string;      // Hành động (Ví dụ: 'Approved', 'Rejected', 'Submitted')
  comment?: string;    // Lời nhắn/Lý do từ chối (Có thể để trống)
  actionTime: string;  // Thời gian xử lý (Chuỗi ISO Format)
}

// 2. Hàm Helper giúp parse chuỗi JSON từ Database thành Mảng an toàn
export const parseStepHistory = (historyStr: string | undefined): IStepHistory[] => {
  if (!historyStr) return [];
  try {
    return JSON.parse(historyStr);
  } catch (error) {
    console.error("Lỗi đọc lịch sử duyệt:", error);
    return [];
  }
};