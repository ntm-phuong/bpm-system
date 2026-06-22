// src/hooks/useProcessForm.ts
// Custom hook: load toàn bộ IFormConfig từ ProcessService
// khi processId thay đổi (user click menu item mới trên Sidebar)
//
// CÁCH DÙNG:
//   const { formConfig, loading, error, reload } = useProcessForm(processId);
//
// Hook tự động:
//   - Hủy request cũ khi processId thay đổi (cleanup với isCancelled flag)
//   - Reset state khi processId = undefined (user chưa chọn quy trình)
//   - Expose reload() để retry khi lỗi

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProcessService, IFormConfig } from '../services/ProcessService';

// ─── State shape ───────────────────────────────────────────

export interface IUseProcessFormState {
  formConfig: IFormConfig | undefined;
  loading: boolean;
  error: string | undefined;
  reload: () => void;
}

// ─── Singleton service ─────────────────────────────────────
// Tạo một lần duy nhất ngoài hook để tránh re-instantiate mỗi render
const processService = new ProcessService();

// ─── Hook ──────────────────────────────────────────────────

export const useProcessForm = (
  processId: number | undefined
): IUseProcessFormState => {

  const [formConfig, setFormConfig]   = useState<IFormConfig | undefined>(undefined);
  const [loading, setLoading]         = useState<boolean>(false);
  const [error, setError]             = useState<string | undefined>(undefined);

  // dùng để trigger reload thủ công mà không cần thay đổi processId
  const [reloadTick, setReloadTick]   = useState<number>(0);

  // Ref để track request đang chạy — tránh setState sau khi component unmount
  // hoặc sau khi processId đã thay đổi sang giá trị khác
  const cancelRef = useRef<boolean>(false);

  const reload = useCallback((): void => {
    setReloadTick(t => t + 1);
  }, []);

  useEffect(() => {
    // Chưa chọn quy trình nào → reset về trạng thái ban đầu
    if (processId === undefined) {
      setFormConfig(undefined);
      setLoading(false);
      setError(undefined);
      return;
    }

    // Đánh dấu request cũ là cancelled khi effect chạy lại
    cancelRef.current = false;

    let isCancelled = false;

    const fetchConfig = async (): Promise<void> => {
      setLoading(true);
      setError(undefined);
      setFormConfig(undefined);

      try {
        const config = await processService.loadFormConfig(processId);

        // Nếu processId đã đổi hoặc component unmount → bỏ qua kết quả
        if (isCancelled) return;

        setFormConfig(config);
      } catch (e) {
        if (isCancelled) return;

        const msg = e instanceof Error ? e.message : 'Không thể tải cấu hình quy trình';
        setError(msg);
        setFormConfig(undefined);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchConfig();

    // Cleanup: đánh dấu cancelled khi processId thay đổi hoặc unmount
    return (): void => {
      isCancelled = true;
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processId, reloadTick]);

  return { formConfig, loading, error, reload };
};