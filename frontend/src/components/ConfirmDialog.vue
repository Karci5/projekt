<template>
  <div class="confirm-overlay" @click.self="$emit('cancel')">
    <div class="confirm-dialog">
      <h3 class="confirm-title">{{ title }}</h3>
      <p class="confirm-message">{{ message }}</p>
      <div class="confirm-actions">
        <button class="btn-cancel" @click="$emit('cancel')">{{ cancelText }}</button>
        <button class="btn-confirm" @click="$emit('confirm')">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: 'Potvrdiť akciu'
    },
    message: {
      type: String,
      default: 'Naozaj chcete pokračovať?'
    },
    confirmText: {
      type: String,
      default: 'Áno'
    },
    cancelText: {
      type: String,
      default: 'Zrušiť'
    }
  },
  emits: ['confirm', 'cancel']
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confirm-dialog {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirm-title {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1c1e21;
}

.confirm-message {
  margin: 0 0 24px 0;
  font-size: 15px;
  color: #65676b;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.confirm-actions button {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #e4e6eb;
  color: #1c1e21;
}

.btn-cancel:hover {
  background: #d8dadf;
}

.btn-confirm {
  background: #e74c3c;
  color: white;
}

.btn-confirm:hover {
  background: #c0392b;
}

@media (max-width: 480px) {
  .confirm-dialog {
    padding: 20px;
  }

  .confirm-title {
    font-size: 18px;
  }

  .confirm-message {
    font-size: 14px;
  }

  .confirm-actions {
    flex-direction: column-reverse;
  }
}

/* ===== DARK MODE ===== */
html.dark-mode .confirm-overlay {
  background: rgba(0, 0, 0, 0.4);
}

html.dark-mode .confirm-dialog {
  background: #0b0b0b;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
}

html.dark-mode .confirm-title {
  color: #e5e7eb;
}

html.dark-mode .confirm-message {
  color: #9ca3af;
}

html.dark-mode .btn-cancel {
  background: #111111;
  color: #e5e7eb;
}

html.dark-mode .btn-cancel:hover {
  background: #1a1a1a;
}

html.dark-mode .btn-confirm {
  background: #dc2626;
}

html.dark-mode .btn-confirm:hover {
  background: #ef4444;
}
</style>
