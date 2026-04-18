<template>
  <div v-if="message" class="edit-bar">
    <div class="edit-content">
      <div class="edit-label">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        <span>Editing message</span>
      </div>
      <input 
        v-model="editText" 
        type="text" 
        class="edit-input" 
        placeholder="Uprav správu..."
        @keyup.enter="saveEdit"
      />
      <div class="edit-actions">
        <button class="save-btn" @click="saveEdit" title="Uložiť">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
          </svg>
        </button>
        <button class="cancel-btn" @click="cancelEdit" title="Zrušiť">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    message: { type: Object, default: null }
  },
  emits: ['save', 'cancel'],
  data() {
    return {
      editText: ''
    }
  },
  watch: {
    message(newVal) {
      if (newVal) {
        this.editText = newVal.message || '';
      }
    }
  },
  methods: {
    saveEdit() {
      if (this.editText.trim()) {
        this.$emit('save', this.editText);
        this.editText = '';
      }
    },
    cancelEdit() {
      this.editText = '';
      this.$emit('cancel');
    }
  }
}
</script>

<style scoped>
.edit-bar {
  background: #f0f2f5;
  border-top: 1px solid #e5e7eb;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  flex: 1;
}

.edit-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #65676b;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.edit-label svg {
  color: #1877f2;
}

.edit-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 18px;
  font-size: 14px;
  outline: none;
}

.edit-input:focus {
  border-color: #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.1);
}

.edit-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.save-btn,
.cancel-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: white;
  color: #65676b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #1877f2;
  color: white;
}

.cancel-btn:hover {
  background: #e4e6eb;
}

@media (max-width: 768px) {
  .edit-bar {
    padding: 10px;
    gap: 8px;
  }

  .edit-label {
    font-size: 12px;
  }

  .save-btn,
  .cancel-btn {
    width: 28px;
    height: 28px;
  }
}

/* ===== DARK MODE ===== */
html.dark-mode .edit-bar {
  background: #0b0b0b;
  border-top-color: #1f2937;
}

html.dark-mode .edit-label {
  color: #9ca3af;
}

html.dark-mode .edit-label svg {
  color: #60a5fa;
}

html.dark-mode .edit-input {
  background: #111111;
  border-color: #1f2937;
  color: #e5e7eb;
}

html.dark-mode .edit-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.15);
}

html.dark-mode .save-btn,
html.dark-mode .cancel-btn {
  background: #111111;
  color: #9ca3af;
}

html.dark-mode .save-btn:hover {
  background: #2563eb;
  color: white;
}

html.dark-mode .cancel-btn:hover {
  background: #1a1a1a;
}
</style>
