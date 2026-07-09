import { IProcessStep } from "../../models";
import { AdminProcessStepRepository } from "../../repositories/Admin/AdminProcessStepRepository";
import {
	ICreateProcessStepInput,
	IUpdateProcessStepInput,
} from "../../pages/AdminPage/types/AdminProcessConfigTypes";

export class AdminProcessStepService {
	private _repo = new AdminProcessStepRepository();

	async getStepsByProcessId(processId: number): Promise<IProcessStep[]> {
		this._validateId(processId, "processId");
		return this._repo.getStepsByProcessId(processId);
	}

	async getStepById(id: number): Promise<IProcessStep | null> {
		this._validateId(id, "id");
		return this._repo.getStepById(id);
	}

	async createStep(input: ICreateProcessStepInput): Promise<IProcessStep> {
		this._validateId(input.processId, "processId");

		const title = input.title?.trim();
		if (!title) {
			throw new Error("Tiêu đề bước quy trình là bắt buộc.");
		}

		this._validateId(input.stepOrder, "stepOrder");
		this._validateOptionalPositiveId(input.stepApproverId, "stepApproverId");
		this._validateOptionalNonNegativeNumber(input.slaHours, "slaHours");
		this._validateOptionalNonNegativeNumber(input.beforeSLA, "beforeSLA");

		await this._ensureStepOrderUnique(input.processId, input.stepOrder);

		const normalizedInput: ICreateProcessStepInput = {
			processId: input.processId,
			title,
			stepOrder: input.stepOrder,
			stepApproverId: input.stepApproverId,
			slaHours: input.slaHours,
			beforeSLA: input.beforeSLA,
			isActive: input.isActive ?? true,
		};

		return this._repo.createStep(normalizedInput);
	}

	async updateStep(input: IUpdateProcessStepInput): Promise<void> {
		this._validateId(input.id, "id");

		const currentStep = await this._repo.getStepById(input.id);
		if (!currentStep) {
			throw new Error(`Không tìm thấy bước quy trình với id: ${input.id}.`);
		}

		const normalizedInput: IUpdateProcessStepInput = {
			id: input.id,
		};

		if (input.title !== undefined) {
			const title = input.title.trim();
			if (!title) {
				throw new Error("Tiêu đề bước quy trình không được để trống.");
			}
			normalizedInput.title = title;
		}

		if (input.stepOrder !== undefined) {
			this._validateId(input.stepOrder, "stepOrder");
			await this._ensureStepOrderUnique(
				currentStep.ProcessIDId,
				input.stepOrder,
				input.id,
			);
			normalizedInput.stepOrder = input.stepOrder;
		}

		this._validateOptionalPositiveId(input.stepApproverId, "stepApproverId");
		if (input.stepApproverId !== undefined) {
			normalizedInput.stepApproverId = input.stepApproverId;
		}

		this._validateOptionalNonNegativeNumber(input.slaHours, "slaHours");
		if (input.slaHours !== undefined) {
			normalizedInput.slaHours = input.slaHours;
		}

		this._validateOptionalNonNegativeNumber(input.beforeSLA, "beforeSLA");
		if (input.beforeSLA !== undefined) {
			normalizedInput.beforeSLA = input.beforeSLA;
		}

		if (input.isActive !== undefined) {
			normalizedInput.isActive = input.isActive;
		}

		if (Object.keys(normalizedInput).length === 1) {
			return;
		}

		await this._repo.updateStep(normalizedInput);
	}

	async deactivateStep(id: number): Promise<void> {
		this._validateId(id, "id");
		await this._repo.deactivateStep(id);
	}

	private _validateId(id: number, fieldName: string): void {
		if (!Number.isFinite(id) || id <= 0) {
			throw new Error(`${fieldName} phải là số dương lớn hơn 0.`);
		}
	}

	private _validateOptionalPositiveId(
		id: number | null | undefined,
		fieldName: string,
	): void {
		if (id === undefined || id === null) {
			return;
		}

		if (!Number.isFinite(id) || id <= 0) {
			throw new Error(`${fieldName} phải là số dương lớn hơn 0.`);
		}
	}

	private _validateOptionalNonNegativeNumber(
		value: number | undefined,
		fieldName: string,
	): void {
		if (value === undefined) {
			return;
		}

		if (!Number.isFinite(value) || value < 0) {
			throw new Error(`${fieldName} phải là số không âm hợp lệ.`);
		}
	}

	private async _ensureStepOrderUnique(
		processId: number,
		stepOrder: number,
		excludeStepId?: number,
	): Promise<void> {
		const steps = await this._repo.getStepsByProcessId(processId);

		const duplicated = steps.some(
			(step) => step.StepOrder === stepOrder && step.Id !== excludeStepId,
		);

		if (duplicated) {
			throw new Error(
				`Thứ tự bước ${stepOrder} đã tồn tại trong quy trình ${processId}.`,
			);
		}
	}
}
