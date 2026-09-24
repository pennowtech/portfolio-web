import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import styles from './ArticleStudio.module.css';

export default function StudioDialog({ open, onClose, title, children, actions, drawer = false, busy = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${drawer ? styles.drawer : ''}`}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (busy || event.target !== ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <div className={styles.dialogHeading}>
        <h2>{title}</h2>
        <button
          type='button'
          className={styles.iconButton}
          disabled={busy}
          onClick={onClose}
          aria-label={`Close ${title}`}
        >
          <FiX />
        </button>
      </div>
      <div className={styles.dialogBody}>{children}</div>
      {actions && <div className={styles.dialogActions}>{actions}</div>}
    </dialog>
  );
}
