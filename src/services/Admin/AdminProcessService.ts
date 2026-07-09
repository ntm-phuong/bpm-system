import { IProcess } from "../../models";
import { AdminProcessRepository } from "../../repositories/Admin/AdminProcessRepository";
import {
	ICreateProcessInput,
	IUpdateProcessInput,
} from "../../pages/AdminPage/types/AdminProcessConfigTypes";

export class AdminProcessService {
	private _repo = new AdminProcessRepository();

	async getProcesses(): Promise<IProcess[]> {
		return this._repo.getProcesses();
	}

	async getProcessById(id: number): Promise<IProcess | null> {
		this._validateId(id, "id");
		return this._repo.getProcessById(id);
	}

	async createProcess(input: ICreateProcessInput): Promise<IProcess> {
		const title = input.title?.trim();
		if (!title) {
			throw new Error("Tiêu đề quy trình là bắt buộc.");
		}

		const rawProcessCode = input.processCode?.trim();
		if (!rawProcessCode) {
			throw new Error("Mã quy trình là bắt buộc.");
		}

		const processCode = this._normalizeCode(rawProcessCode);
		await this._ensureProcessCodeUnique(processCode);

		const normalizedInput: ICreateProcessInput = {
			title,
			processCode,
			description:
				input.description !== undefined ? input.description.trim() : undefined,
			isActive: input.isActive ?? true,
		};

		return this._repo.createProcess(normalizedInput);
	}

	async updateProcess(input: IUpdateProcessInput): Promise<void> {
		this._validateId(input.id, "id");

		const normalizedInput: IUpdateProcessInput = {
			id: input.id,
		};

		if (input.title !== undefined) {
			const title = input.title.trim();
			if (!title) {
				throw new Error("Tiêu đề quy trình không được để trống.");
			}
			normalizedInput.title = title;
		}

		if (input.processCode !== undefined) {
			const rawProcessCode = input.processCode.trim();
			if (!rawProcessCode) {
				throw new Error("Mã quy trình không được để trống.");
			}

			const processCode = this._normalizeCode(rawProcessCode);
			await this._ensureProcessCodeUnique(processCode, input.id);
			normalizedInput.processCode = processCode;
		}

		if (input.description !== undefined) {
			normalizedInput.description = input.description.trim();
		}

		if (input.isActive !== undefined) {
			normalizedInput.isActive = input.isActive;
		}

		if (Object.keys(normalizedInput).length === 1) {
			return;
		}

		await this._repo.updateProcess(normalizedInput);
	}

	async deactivateProcess(id: number): Promise<void> {
		this._validateId(id, "id");
		await this._repo.deactivateProcess(id);
	}

	private _validateId(id: number, fieldName: string): void {
		if (!Number.isFinite(id) || id <= 0) {
			throw new Error(`${fieldName} phải là số dương lớn hơn 0.`);
		}
	}

	private _normalizeCode(code: string): string {
		return code.trim().toUpperCase();
	}

	private async _ensureProcessCodeUnique(
		processCode: string,
		excludeId?: number,
	): Promise<void> {
		const normalizedCode = this._normalizeCode(processCode);
		const processes = await this._repo.getProcesses();

		const duplicated = processes.some(
			(process) =>
				process.Id !== excludeId &&
				this._normalizeCode(process.ProcessCode) === normalizedCode,
		);

		if (duplicated) {
			throw new Error(`Mã quy trình "${normalizedCode}" đã tồn tại.`);
		}
	}
}
