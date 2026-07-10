import { BaseRepository } from "../BaseRepository";
import { LISTS } from "../../constants/lists";
import { IProcess } from "../../models";
import {
  ICreateProcessInput,
  IUpdateProcessInput,
} from "../../pages/AdminPage/types/AdminProcessConfigTypes";

const PROCESS_SELECT = [
  "Id",
  "Title",
  "ProcessCode",
  "Description",
  "IsActive",
] as const;

export class AdminProcessRepository extends BaseRepository {
  async getProcesses(): Promise<IProcess[]> {
    try {
      const items = await this.sp.web.lists
        .getByTitle(LISTS.PROCESSES)
        .items.select(...PROCESS_SELECT)
        .orderBy("Title", true)();

      return items.map(this._mapProcess);
    } catch (e) {
      this.handleError(e, "getProcesses");
    }
  }

  async getProcessById(id: number): Promise<IProcess | null> {
    try {
      const item = await this.sp.web.lists
        .getByTitle(LISTS.PROCESSES)
        .items.getById(id)
        .select(...PROCESS_SELECT)();

      return item ? this._mapProcess(item) : null;
    } catch (e) {
      this.handleError(e, "getProcessById");
    }
  }

  async createProcess(input: ICreateProcessInput): Promise<IProcess> {
    try {
      const payload: Record<string, unknown> = {
        Title: input.title,
        ProcessCode: input.processCode,
        Description: input.description ?? "",
        IsActive: input.isActive ?? true,
      };

      const result = await this.sp.web.lists
        .getByTitle(LISTS.PROCESSES)
        .items.add(payload);

      const created = await this.getProcessById(result.Id);

      if (!created) {
        throw new Error(
          `Không tìm thấy quy trình sau khi tạo. Id: ${result.Id}`,
        );
      }

      return created;
    } catch (e) {
      this.handleError(e, "createProcess");
    }
  }
  async updateProcess(input: IUpdateProcessInput): Promise<void> {
    try {
      const payload: Record<string, unknown> = {};

      if (input.title !== undefined) {
        payload.Title = input.title;
      }

      if (input.processCode !== undefined) {
        payload.ProcessCode = input.processCode;
      }

      if (input.description !== undefined) {
        payload.Description = input.description;
      }

      if (input.isActive !== undefined) {
        payload.IsActive = input.isActive;
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      await this.sp.web.lists
        .getByTitle(LISTS.PROCESSES)
        .items.getById(input.id)
        .update(payload);
    } catch (e) {
      this.handleError(e, "updateProcess");
    }
  }
  async deactivateProcess(id: number): Promise<void> {
    try {
      await this.updateProcess({
        id,
        isActive: false,
      });
    } catch (e) {
      this.handleError(e, "deactivateProcess");
    }
  }

  private _mapProcess = (raw: Record<string, unknown>): IProcess => ({
    Id: raw["Id"] as number,
    Title: raw["Title"] as string,
    ProcessCode: raw["ProcessCode"] as string,
    Description: raw["Description"] as string | undefined,
    IsActive: raw["IsActive"] as boolean,
  });
}
