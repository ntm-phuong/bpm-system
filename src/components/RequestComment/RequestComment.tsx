import * as React from "react";
import { IComment } from "../../models";
import {
  CommentRepository,
  ICreateCommentWithAttachmentsInput,
} from "../../repositories/CommentRepository";
import styles from "./RequestComment.module.scss";

interface IRequestCommentProps {
  requestId: number;
  currentUserId: number;
}

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
};

export const RequestComment: React.FC<IRequestCommentProps> = ({
  requestId,
  currentUserId,
}) => {
  const repository = React.useMemo(() => new CommentRepository(), []);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [comments, setComments] = React.useState<IComment[]>([]);
  const [content, setContent] = React.useState<string>("");
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  const loadComments = React.useCallback(async (): Promise<void> => {
    if (!requestId) {
      setComments([]);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await repository.getCommentsByRequestId(requestId);
      setComments(data);
    } catch (error) {
      console.error("Load comments failed:", error);
      setErrorMessage("Không thể tải bình luận.");
    } finally {
      setLoading(false);
    }
  }, [requestId, repository]);

  React.useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setSelectedFiles(files);
  };

  const handleSubmit = async (): Promise<void> => {
    const trimmedContent = content.trim();

    if (!trimmedContent && selectedFiles.length === 0) {
      setErrorMessage("Vui lòng nhập nội dung hoặc chọn tệp đính kèm.");
      return;
    }

    if (!requestId || !currentUserId) {
      setErrorMessage("Thiếu thông tin người dùng hoặc phiếu để gửi bình luận.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const payload: ICreateCommentWithAttachmentsInput = {
      requestId,
      content: trimmedContent,
      commentById: currentUserId,
      files: selectedFiles,
    };

    try {
      await repository.createCommentWithAttachments(payload);
      setContent("");
      setSelectedFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadComments();
    } catch (error) {
      console.error("Create comment failed:", error);
      setErrorMessage("Gửi bình luận thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>Bình luận</h3>

      <div className={styles.editor}>
        <textarea
          className={styles.textarea}
          rows={4}
          placeholder="Nhập nội dung bình luận..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={submitting}
        />

        <div className={styles.actionsRow}>
          <label className={styles.fileInputLabel} htmlFor="comment-attachment-input">
            Chọn tệp
          </label>
          <input
            id="comment-attachment-input"
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            multiple
            onChange={handleFilesChange}
            disabled={submitting}
          />

          <button
            type="button"
            className={styles.submitButton}
            onClick={() => {
              void handleSubmit();
            }}
            disabled={submitting}
          >
            {submitting ? "Đang gửi..." : "Gửi bình luận"}
          </button>
        </div>

        {selectedFiles.length > 0 && (
          <div className={styles.filesSummary}>
            Đã chọn {selectedFiles.length} tệp:
            <ul className={styles.fileList}>
              {selectedFiles.map((file) => (
                <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}

        {errorMessage && <div className={styles.error}>{errorMessage}</div>}
      </div>

      <div className={styles.commentList}>
        {loading ? (
          <div className={styles.feedback}>Đang tải bình luận...</div>
        ) : comments.length === 0 ? (
          <div className={styles.feedback}>Chưa có bình luận nào.</div>
        ) : (
          comments.map((comment) => (
            <article key={comment.Id} className={styles.commentItem}>
              <header className={styles.commentHeader}>
                <strong>{comment.CommentBy?.Title || "-"}</strong>
                <span>{formatDateTime(comment.Created)}</span>
              </header>

              <div className={styles.commentContent}>{comment.Content || "-"}</div>

              {comment.AttachmentFiles && comment.AttachmentFiles.length > 0 && (
                <div className={styles.attachmentBlock}>
                  <div className={styles.attachmentTitle}>Tệp đính kèm:</div>
                  <ul className={styles.fileList}>
                    {comment.AttachmentFiles.map((file) => (
                      <li key={`${comment.Id}-${file.ServerRelativeUrl}`}>
                        <a
                          href={file.ServerRelativeUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {file.FileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
};
