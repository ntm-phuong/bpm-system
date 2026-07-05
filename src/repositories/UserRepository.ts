import { getSP } from '../config/pnpConfig';
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";

export class UserRepository {
  public static async getCurrentUser(): Promise<{ Title: string; Email: string }> {
    try {
      const sp = getSP(); 
      
      const user = await sp.web.currentUser(); 
      
      return {
        Title: user.Title,
        Email: user.Email
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin User: ", error);
      throw error;
    }
  }
}