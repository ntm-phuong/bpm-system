import { EmployeeRole } from "../constants/enums";

export interface IEmployee {
  Id: number;
  Title: string;      // FullName
  Email: string;
  Department: string;
  ManagerId?: number;
  ManagerTitle?: string;
  Role: EmployeeRole;
  IsActive: boolean;
}
 