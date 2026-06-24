import * as React from 'react';
import { useRef, useState } from 'react';
import { PrimaryButton, Icon, IconButton } from '@fluentui/react';
import styles from '../AttachmentPanel.module.scss';

export interface IAttachmentPanelProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export const AttachmentPanel: React.FC<IAttachmentPanelProps> = ({ files, onFilesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Kích hoạt input file ẩn khi bấm nút "Add File"
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Xử lý khi người dùng chọn file qua hộp thoại
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      onFilesChange([...files, ...newFiles]);
    }
    // Reset input để có thể chọn lại cùng một file nếu vừa xóa
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Xóa file khỏi danh sách
  const handleRemoveFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    onFilesChange(updatedFiles);
  };

  // --- Các hàm hỗ trợ Drag & Drop ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      onFilesChange([...files, ...newFiles]);
    }
  };

  return (
    <div className={styles.attachmentCard}>
      <h3 className={styles.headerTitle}>Tài liệu đính kèmxxxxxx</h3>

      {/* Vùng kéo thả file (Dashed border area) */}
      <div 
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <PrimaryButton 
          className={styles.addFileBtn} 
          onClick={handleButtonClick}
        >
          <Icon iconName="Attach" className={styles.attachIcon} /> 
          Add File
        </PrimaryButton>
        
        <span className={styles.dragHint}>hoặc kéo thả file vào đây</span>
      </div>

      {/* Danh sách các file đã chọn */}
      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file, index) => (
            <div key={index} className={styles.fileItem}>
              <Icon iconName="Page" className={styles.fileIcon} />
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>({(file.size / 1024).toFixed(1)} KB)</span>
              <IconButton 
                iconProps={{ iconName: 'Cancel' }} 
                title="Xóa file" 
                ariaLabel="Xóa file" 
                className={styles.removeBtn}
                onClick={() => handleRemoveFile(index)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};