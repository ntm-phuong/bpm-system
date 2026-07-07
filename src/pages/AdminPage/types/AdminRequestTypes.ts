import { RequestStatus } from "../../../constants/enums";
import { IPerson, IRequest } from "../../../models";

export interface IAdminStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  emergency: number;
  overdue: number;
}

export interface IAdminEditForm {
  id: number;
  status: RequestStatus;
  currentStep: number;
  currentStepName: string;
  currentApproverId?: number;
  isEmergency: boolean;
}

export interface IAdminRequestStatsProps {
  stats: IAdminStats;
}

export interface IAdminRequestToolbarProps {
  keyword: string;
  statusFilter: string;
  loading: boolean;
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
}

export interface IAdminRequestTableProps {
  items: IRequest[];
  loading: boolean;
  error?: string;
  deletingId?: number;
  onOpenDetail: (requestId: number) => void;
  onEdit: (item: IRequest) => void;
  onDelete: (requestId: number) => void;
}

export interface IAdminRequestEditPanelProps {
  editForm: IAdminEditForm;
  currentUserId: number;
  savingEdit: boolean;
  approverKeyword: string;
  approverCandidates: IPerson[];
  searchingApprover: boolean;
  selectedApprover?: IPerson;
  onChangeForm: (form: IAdminEditForm) => void;
  onSearchApprover: (keyword: string) => void;
  onChooseApprover: (user: IPerson) => void;
  onClearApprover: () => void;
  onSave: () => void;
  onCancel: () => void;
}
