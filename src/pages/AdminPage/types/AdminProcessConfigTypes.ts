import { FieldType } from "../../../constants/enums";

export interface ICreateProcessInput {
  title: string;
  processCode: string;
  description?: string;
  isActive?: boolean;
}

export interface IUpdateProcessInput {
  id: number;
  title?: string;
  processCode?: string;
  description?: string;
  isActive?: boolean;
}

export interface ICreateProcessStepInput {
  processId: number;
  title: string;
  stepOrder: number;
  stepApproverId?: number;
  slaHours?: number;
  beforeSLA?: number;
  isActive?: boolean;
}

export interface IUpdateProcessStepInput {
  id: number;
  title?: string;
  stepOrder?: number;
  stepApproverId?: number | null;
  slaHours?: number;
  beforeSLA?: number;
  isActive?: boolean;
}

export interface ICreateFieldConfigInput {
  processId: number;
  stepId?: number;
  componentType?: string;
  fieldInternalName: string;
  fieldDisplayName: string;
  fieldType: FieldType;
  fieldOptions?: string[];
  isRequired: boolean;
  isVisible: boolean;
  isEditable: boolean;
}

export interface IUpdateFieldConfigInput {
  id: number;
  stepId?: number | null;
  componentType?: string;
  fieldInternalName?: string;
  fieldDisplayName?: string;
  fieldType?: FieldType;
  fieldOptions?: string[];
  isRequired?: boolean;
  isVisible?: boolean;
  isEditable?: boolean;
}