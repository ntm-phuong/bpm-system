import { EmployeeRole } from '../constants/enums';
import { LISTS } from '../constants/lists';
import { getSP } from '../config/pnpConfig';
import { IEmployee } from '../models/IEmployee';
import '@pnp/sp/items';
import '@pnp/sp/lists';
import '@pnp/sp/webs';

export class EmployeeRepository {
  private readonly selectFields: string[] = [
    'Id',
    'Title',
    'Email',
    'Department',
    'ManagerId',
    'Role',
    'IsActive',
    'Manager/Title'
  ];

  private readonly expandFields: string[] = ['Manager'];

  private get employeesList() {
    return getSP().web.lists.getByTitle(LISTS.EMPLOYEES).items;
  }

  public async getAll(): Promise<IEmployee[]> {
    const items = await this.employeesList
      .select(...this.selectFields)
      .expand(...this.expandFields)();

    return items.map((item) => this.mapToEmployee(item));
  }

  public async getById(id: number): Promise<IEmployee | undefined> {
    try {
      const item = await this.employeesList
        .getById(id)
        .select(...this.selectFields)
        .expand(...this.expandFields)();

      return this.mapToEmployee(item);
    } catch (error) {
      return undefined;
    }
  }

  public async getByEmail(email: string): Promise<IEmployee | undefined> {
    const escapedEmail = email.replace(/'/g, "''");

    const items = await this.employeesList
      .select(...this.selectFields)
      .expand(...this.expandFields)
      .filter(`Email eq '${escapedEmail}'`)
      .top(1)();

    if (items.length === 0) {
      return undefined;
    }

    return this.mapToEmployee(items[0]);
  }

  public async getManager(employeeId: number): Promise<IEmployee | undefined> {
    const employee = await this.getById(employeeId);

    if (!employee || !employee.ManagerId) {
      return undefined;
    }

    return this.getById(employee.ManagerId);
  }

  public async getActiveEmployees(): Promise<IEmployee[]> {
    const items = await this.employeesList
      .select(...this.selectFields)
      .expand(...this.expandFields)
      .filter('IsActive eq 1')();

    return items.map((item) => this.mapToEmployee(item));
  }

  private mapToEmployee(item: any): IEmployee {
    const roleValue = (item.Role || '').toString() as EmployeeRole;
     const isValidRole = Object.keys(EmployeeRole).some(
    (key) => (EmployeeRole as any)[key] === roleValue
  );

    return {
      Id: item.Id,
      Title: item.Title || '',
      Email: item.Email || '',
      Department: item.Department || '',
      ManagerId: item.ManagerId || undefined,
      ManagerTitle: item.Manager?.Title || undefined,
      Role: isValidRole ? roleValue : EmployeeRole.Staff,
      IsActive: Boolean(item.IsActive)
    };
  }
}
