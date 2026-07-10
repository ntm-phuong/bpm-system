import * as React from 'react';
import { IProcess } from '../../../../models';
import styles from '../../AdminProcessConfigPage.module.scss';

interface IProcessActionProps {
    process?: IProcess;
    onCreate: () => void;
    onEdit: () => void;
    onDeactivate: () => Promise<void>;
}

export const ProcessAction:React.FC<IProcessActionProps> = ({ process, onCreate, onEdit, onDeactivate }) => {
    return(
        <section className={styles.panel}>
      <h3>Process Actions</h3>

      <div className={styles.toolbar}>
        <button type="button" onClick={onCreate}>
          Thêm quy trình
        </button>

        <button
          type="button"
          onClick={onEdit}
          disabled={!process}
        >
          Sửa quy trình
        </button>

        <button
          type="button"
          onClick={() => {
            onDeactivate().catch((error) => {
              console.error("Không thể tắt quy trình:", error);
            });
          }}
          disabled={!process || !process.IsActive}
        >
          Tắt quy trình
        </button>
      </div>
    </section>    
    );
};