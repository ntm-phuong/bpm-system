// src/hooks/useMenuItems.ts
// Custom hook: load danh sách menu từ ProcessService cho Sidebar
// Chỉ fetch một lần khi mount — menu không thay đổi trong session
//
// CÁCH DÙNG:
//   const { menuItems, loading, error } = useMenuItems();

import { useState, useEffect } from 'react';
import { ProcessService, IMenuItems } from '../services/ProcessService';

export interface IUseMenuItemsState {
  menuItems: IMenuItems[];
  loading: boolean;
  error: string | undefined;
}

const processService = new ProcessService();

export const useMenuItems = (): IUseMenuItemsState => {
  const [menuItems, setMenuItems] = useState<IMenuItems[]>([]);
  const [loading, setLoading]     = useState<boolean>(true);
  const [error, setError]         = useState<string | undefined>(undefined);

  useEffect(() => {
    let isCancelled = false;

    const fetch = async (): Promise<void> => {
      try {
        const items = await processService.getMenuItems();
        if (!isCancelled) setMenuItems(items);
      } catch (e) {
        if (!isCancelled) {
          setError(e instanceof Error ? e.message : 'Không thể tải danh sách quy trình');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetch();
    return (): void => { isCancelled = true; };
  }, []); // chỉ fetch một lần khi mount

  return { menuItems, loading, error };
};