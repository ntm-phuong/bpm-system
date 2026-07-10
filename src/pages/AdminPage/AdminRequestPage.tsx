import * as React from "react";
import { IconButton, Modal } from "@fluentui/react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IPerson, IRequest } from "../../models";
import { RequestStatus } from "../../constants/enums";
import {
  RequestRepository,
  IUpdateRequestAdminInput,
} from "../../repositories/RequestRepository";
import { UserService as SiteUsersService } from "../../services/UserService";
import { AdminRequestEditPanel } from "./components/Requests/AdminRequestEditPanel";
import { AdminRequestStats } from "./components/Requests/AdminRequestStats";
import { AdminRequestTable } from "./components/Requests/AdminRequestTable";
import { AdminRequestToolbar } from "./components/Requests/AdminRequestToolbar";
import { IAdminEditForm, IAdminStats } from "./types/AdminRequestTypes";
import styles from "./AdminRequestPage.module.scss";

interface IAdminRequestPageProps {
  currentUserId: number;
  context: WebPartContext;
  onOpenDetail: (requestId: number) => void;
}

export const AdminRequestPage: React.FC<IAdminRequestPageProps> = ({
  currentUserId,
  context,
  onOpenDetail,
}) => {
  const requestRepository = React.useMemo(() => new RequestRepository(), []);
  const siteUsersService = React.useMemo(
    () => new SiteUsersService(context),
    [context],
  );

  const [items, setItems] = React.useState<IRequest[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const [keyword, setKeyword] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const [editingItemId, setEditingItemId] = React.useState<number | undefined>(
    undefined,
  );
  const [editForm, setEditForm] = React.useState<IAdminEditForm | undefined>(
    undefined,
  );
  const [savingEdit, setSavingEdit] = React.useState<boolean>(false);

  const [approverKeyword, setApproverKeyword] = React.useState<string>("");
  const [approverCandidates, setApproverCandidates] = React.useState<IPerson[]>(
    [],
  );
  const [searchingApprover, setSearchingApprover] = React.useState<boolean>(
    false,
  );

  const [deletingId, setDeletingId] = React.useState<number | undefined>(
    undefined,
  );

  const loadRequests = React.useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(undefined);

      const data = await requestRepository.getAllRequestsForAdmin();
      setItems(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Không thể tải danh sách request: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [requestRepository]);

  React.useEffect(() => {
    loadRequests().catch((e) => {
      console.error("Không thể tải dữ liệu admin request:", e);
    });
  }, [loadRequests]);

  const stats = React.useMemo<IAdminStats>(() => {
    const overdue = items.filter((item) => {
      if (item.CompleteSLA === "Overdue") {
        return true;
      }

      if (
        typeof item.ExpectedSLA === "number" &&
        typeof item.ActualSLA === "number"
      ) {
        return item.ActualSLA > item.ExpectedSLA;
      }

      return false;
    }).length;

    return {
      total: items.length,
      pending: items.filter((item) => item.Status === RequestStatus.Pending)
        .length,
      approved: items.filter((item) => item.Status === RequestStatus.Approved)
        .length,
      rejected: items.filter((item) => item.Status === RequestStatus.Rejected)
        .length,
      emergency: items.filter((item) => Boolean(item.IsEmergency)).length,
      overdue,
    };
  }, [items]);

  const filteredItems = React.useMemo<IRequest[]>(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || String(item.Status) === statusFilter;

      if (!normalizedKeyword) {
        return matchesStatus;
      }

      const searchableValues = [
        String(item.Id),
        item.Title,
        item.Requester?.Title,
        item.Requester?.EMail,
        item.CurrentApprover?.Title,
        item.CurrentApprover?.EMail,
        item.ProcessTitle,
        item.CurrentStepName,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const matchesKeyword = searchableValues.some((value) =>
        value.includes(normalizedKeyword),
      );

      return matchesStatus && matchesKeyword;
    });
  }, [items, keyword, statusFilter]);

  const selectedApprover = React.useMemo<IPerson | undefined>(() => {
    if (!editForm?.currentApproverId) {
      return undefined;
    }

    const fromCandidates = approverCandidates.find(
      (user) => user.Id === editForm.currentApproverId,
    );

    if (fromCandidates) {
      return fromCandidates;
    }

    const fromItems = items.find((item) => item.Id === editForm.id)?.CurrentApprover;
    return fromItems ?? undefined;
  }, [approverCandidates, editForm, items]);

  const startEdit = (item: IRequest): void => {
    setEditingItemId(item.Id);
    setApproverCandidates([]);
    setApproverKeyword("");
    setEditForm({
      id: item.Id,
      status: item.Status,
      currentStep: item.CurrentStep ?? 0,
      currentStepName: item.CurrentStepName ?? "",
      currentApproverId: item.CurrentApproverId ?? undefined,
      isEmergency: Boolean(item.IsEmergency),
    });
  };

  const cancelEdit = (): void => {
    setEditingItemId(undefined);
    setEditForm(undefined);
    setApproverCandidates([]);
    setApproverKeyword("");
  };

  const handleSearchApprover = async (rawKeyword: string): Promise<void> => {
    const searchTerm = rawKeyword.trim();

    setApproverKeyword(rawKeyword);

    if (!searchTerm) {
      setApproverCandidates([]);
      return;
    }

    try {
      setSearchingApprover(true);
      const users = await siteUsersService.searchUser(searchTerm);
      setApproverCandidates(users);
    } catch (e) {
      console.error("Tìm người xử lý thất bại:", e);
      setApproverCandidates([]);
    } finally {
      setSearchingApprover(false);
    }
  };

  const chooseApprover = (user: IPerson): void => {
    if (!editForm) {
      return;
    }

    setEditForm({
      ...editForm,
      currentApproverId: user.Id,
    });

    setApproverKeyword(`${user.Title} - ${user.EMail ?? ""}`);
    setApproverCandidates([]);
  };

  const clearApprover = (): void => {
    if (!editForm) {
      return;
    }

    setEditForm({
      ...editForm,
      currentApproverId: undefined,
    });
    setApproverKeyword("");
    setApproverCandidates([]);
  };

  const saveEdit = async (): Promise<void> => {
    if (!editForm) {
      return;
    }

    const payload: IUpdateRequestAdminInput = {
      id: editForm.id,
      status: editForm.status,
      currentStep: editForm.currentStep,
      currentStepName: editForm.currentStepName,
      currentApproverId: editForm.currentApproverId ?? null,
      isEmergency: editForm.isEmergency,
    };

    try {
      setSavingEdit(true);
      await requestRepository.updateRequestAdmin(payload);
      alert("Cập nhật request thành công.");
      cancelEdit();
      await loadRequests();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      alert(`Cập nhật request thất bại: ${message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteRequest = async (requestId: number): Promise<void> => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa request #${requestId}? Chỉ item trong list Requests sẽ bị xóa.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(requestId);
      await requestRepository.deleteRequest(requestId);
      alert("Xóa request thành công.");
      if (editingItemId === requestId) {
        cancelEdit();
      }
      await loadRequests();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      alert(`Xóa request thất bại: ${message}`);
    } finally {
      setDeletingId(undefined);
    }
  };

  const handleRefreshClick = (): void => {
    loadRequests().catch((e) => {
      console.error("Tải lại danh sách request thất bại:", e);
    });
  };

  const handleDeleteClick = (requestId: number): void => {
    deleteRequest(requestId).catch((e) => {
      console.error("Xóa request thất bại:", e);
    });
  };

  const handleApproverInputChange = (value: string): void => {
    handleSearchApprover(value).catch((e) => {
      console.error("Tìm người xử lý thất bại:", e);
    });
  };

  const handleSaveEditClick = (): void => {
    saveEdit().catch((e) => {
      console.error("Lưu chỉnh sửa request thất bại:", e);
    });
  };

  return (
    <div className={styles.page}>
      <section className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>Quản lý phiếu</h2>
        </div>

        <AdminRequestStats stats={stats} />
      </section>

      <section className={styles.panel}>
        <AdminRequestToolbar
          keyword={keyword}
          statusFilter={statusFilter}
          loading={loading}
          onKeywordChange={setKeyword}
          onStatusChange={setStatusFilter}
          onRefresh={handleRefreshClick}
        />

        <AdminRequestTable
          items={filteredItems}
          loading={loading}
          error={error}
          deletingId={deletingId}
          onOpenDetail={onOpenDetail}
          onEdit={startEdit}
          onDelete={handleDeleteClick}
        />
      </section>

      <Modal
        isOpen={editingItemId !== undefined && Boolean(editForm)}
        onDismiss={cancelEdit}
        isBlocking={false}
        containerClassName={styles.editModalContainer}
      >
        <div className={styles.editModalHeader}>
          <span className={styles.editModalTitle}>Chỉnh sửa request</span>
          <IconButton
            iconProps={{ iconName: "Cancel" }}
            ariaLabel="Đóng"
            title="Đóng"
            onClick={cancelEdit}
          />
        </div>

        {editForm && (
          <AdminRequestEditPanel
            editForm={editForm}
            currentUserId={currentUserId}
            savingEdit={savingEdit}
            approverKeyword={approverKeyword}
            approverCandidates={approverCandidates}
            searchingApprover={searchingApprover}
            selectedApprover={selectedApprover}
            onChangeForm={setEditForm}
            onSearchApprover={handleApproverInputChange}
            onChooseApprover={chooseApprover}
            onClearApprover={clearApprover}
            onSave={handleSaveEditClick}
            onCancel={cancelEdit}
          />
        )}
      </Modal>
    </div>
  );
};
