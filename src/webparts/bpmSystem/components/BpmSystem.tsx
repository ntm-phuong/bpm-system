import * as React from 'react';
import { useState, useEffect } from 'react';
import { IBpmSystemProps } from './IBpmSystemProps';
import { UserService } from '../../../repositories/UserRepository';

const BpmSystem: React.FC<IBpmSystemProps> = (props) => {
  const [currentUser, setCurrentUser] = useState<{Title: string, Email: string} | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await UserService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Không lấy được dữ liệu:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI' }}>
      {currentUser ? (
        <h2>Xin chào {currentUser.Title} - {currentUser.Email} 👋</h2>
      ) : (
        <p>Đang tải thông tin hệ thống...</p>
      )}
    </div>
  );
};

export default BpmSystem;