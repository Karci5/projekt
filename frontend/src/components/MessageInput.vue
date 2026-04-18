<template>
  <div class="input-wrapper">
    <div v-if="isEditing" class="edit-banner">
      <span>Upravuješ správu</span>
      <button class="cancel-edit" @click="$emit('cancel-edit')">✕</button>
    </div>
    <div v-else-if="replyTo" class="edit-banner reply-banner">
      <div class="reply-info">
        <span v-if="isReplyToSelf" class="reply-to-label">Odpovedáš si na svoju správu</span>
        <span v-else class="reply-to-label">Odpovedáš na správu od používateľa <strong>{{ replyTo.username || 'Neznámy' }}</strong></span>
        <span class="reply-message-preview">{{ replyTo.message || 'Správa bez textu' }}</span>
      </div>
      <button class="cancel-edit reply-cancel-btn" @click="$emit('cancel-reply')" aria-label="Zrušiť odpoveď">✕</button>
    </div>

    <!-- Attachment preview before sending -->
    <div v-if="pendingAttachment" class="attachment-preview-banner">
      <div class="attachment-preview-content">
        <img v-if="pendingAttachment.type === 'image'" :src="pendingAttachment.data" class="attachment-thumb" alt="Náhľad" />
        <video v-else-if="pendingAttachment.type === 'video'" :src="pendingAttachment.data" class="attachment-thumb" muted></video>
        <span class="attachment-filename">{{ pendingAttachment.filename || 'Príloha' }}</span>
      </div>
      <button class="attachment-close-x" @click="clearPendingAttachment" title="Zrušiť" aria-label="Zrušiť prílohu">✕</button>
    </div>

    <div class="input-area" @paste="onPaste" @dragover.prevent @drop.prevent="onDrop">
      <button class="icon-btn" @click="openFilePicker" title="Pridať prílohu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <path d="M21 15l-5-5L5 21"></path>
        </svg>
      </button>
      <input ref="file" type="file" accept="image/*,video/*" style="display:none" @change="onFileChange" />
      <input v-model="text" @keyup.enter="onSend" placeholder="Napíš správu..." />
      <button @click="onSend">Poslať</button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    value: { type: String, default: '' },
    isEditing: { type: Boolean, default: false },
    replyTo: { type: Object, default: null }
  },
  emits: ['send', 'cancel-edit', 'cancel-reply'],
  data() { return { text: '', pendingAttachment: null } },
  watch: {
    value: {
      immediate: true,
      handler(v) {
        this.text = v || '';
      }
    }
  },
  computed: {
    isReplyToSelf() {
      if (!this.replyTo) return false;
      if (this.replyTo.mine === true) return true;
      const name = String(this.replyTo.username || '').trim().toLowerCase();
      return name === 'ty';
    }
  },
  methods: {
    onSend() {
      // If there is a pending attachment, send it (optionally with text)
      if (this.pendingAttachment) {
        const t = this.text && this.text.trim();
        if (t) {
          // send text separately first, then attachment
          this.$emit('send', this.replyTo ? { message: t, replyTo: this.replyTo } : t);
        }
        this.$emit('send', { attachment: this.pendingAttachment });
        this.pendingAttachment = null;
        this.text = '';
        return;
      }
      const t = this.text && this.text.trim();
      if (t) {
        this.$emit('send', this.replyTo ? { message: t, replyTo: this.replyTo } : t);
        this.text = '';
      }
    },
    clearPendingAttachment() {
      this.pendingAttachment = null;
    },
    openFilePicker() {
      this.$refs.file && this.$refs.file.click();
    },
    onFileChange(e) {
      const files = e.target.files; if (!files || !files.length) return;
      this.handleFiles(files);
      e.target.value = null;
    },
    onDrop(e) {
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) this.handleFiles(files);
    },
    onPaste(e) {
      const items = (e.clipboardData && e.clipboardData.items) || [];
      const files = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === 'file') files.push(it.getAsFile());
      }
      if (files.length) {
        e.preventDefault();
        this.handleFiles(files);
      }
    },
    handleFiles(fileList) {
      // Show preview for the first file; send immediately for subsequent ones
      const filesArr = Array.from(fileList);
      filesArr.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const data = ev.target.result;
          const type = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'file');
          const attachment = { type, data, filename: file.name };
          if (idx === 0) {
            // Show preview for first file
            this.pendingAttachment = attachment;
          } else {
            // Send additional files directly
            this.$emit('send', { attachment });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  },
  beforeUnmount() {}
}
</script>

<style scoped>
.input-wrapper { position: sticky; bottom: 0; z-index: 20; background: white; padding: 0; }
.edit-banner { display: flex; justify-content: space-between; align-items: center; padding: clamp(6px, 1.5vh, 10px) clamp(8px, 2vw, 14px); background: #e6f0ff; color: #1a4fb3; border-top: 1px solid #cddcff; border-bottom: 1px solid #cddcff; font-size: 13px; }
.reply-banner {
  margin: 0;
  padding: 8px 12px;
  border: none;
  border-left: 3px solid #60a5fa;
  border-radius: 0;
  background: #eceff3;
  color: #111827;
  min-height: 48px;
}
.reply-banner .reply-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  text-align: left;
}
.reply-to-label { font-size: 12px; font-weight: 500; color: #6b7280; }
.reply-to-label strong { color: #1f2937; font-weight: 700; }
.reply-message-preview {
  font-size: 13px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.cancel-edit { border: none; background: transparent; color: #1a4fb3; font-size: 16px; cursor: pointer; padding: 0 4px }
.reply-cancel-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #6b7280;
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}
.reply-cancel-btn:hover { background: #eef2f7; color: #111827; }

.input-area { display: flex; align-items: center; gap: clamp(6px, 1.5vw, 12px); padding: clamp(8px, 1.5vh, 12px); background: white; border-top: 1px solid #ddd; }
input[type="text"], input[type="search"], input[type="email"], input { flex: 1; padding: clamp(8px, 1.5vh, 12px); border-radius: 20px; border: 1px solid #ccc; }
.icon-btn {
  color: #111827;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: none;
  transform: none;
  animation: none;
  outline: none;
  box-shadow: none;
  -webkit-appearance: none;
  appearance: none;
}
.icon-btn:hover {
  background: transparent;
  transform: none;
  animation: none;
}
.icon-btn:hover svg { stroke: currentColor; }
.icon-btn:focus { outline: none; box-shadow: none; }
.icon-btn:active { outline: none; box-shadow: none; }
.icon-btn:focus,
.icon-btn:active {
  transform: none;
  animation: none;
  transition: none;
}
button { background:#1877f2; color:white; border:none; padding:8px 12px; border-radius:16px; cursor:pointer }

/* Attachment preview */
.attachment-preview-banner { display: flex; justify-content: space-between; align-items: center; padding: clamp(6px, 1.5vh, 10px) clamp(8px, 2vw, 14px); background: #f0faf0; border-top: 1px solid #c8e6c9; border-bottom: 1px solid #c8e6c9; }
.attachment-preview-content { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
.attachment-thumb { max-height:80px; max-width:120px; border-radius:8px; object-fit:cover; border:1px solid #ddd; }
.attachment-filename { font-size:12px; color:#555; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.attachment-close-x {
  all: unset;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  font-size: 34px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  margin-right: 10px;
  -webkit-tap-highlight-color: transparent;
}

.attachment-close-x:hover {
  color: #111827;
}

.attachment-close-x:focus,
.attachment-close-x:active {
  color: #111827;
  outline: none;
  box-shadow: none;
}

/* ===== DARK MODE ===== */
html.dark-mode .input-wrapper { background: #000000; }
html.dark-mode .input-area { background: #000000; border-top-color: #1f2937; }
html.dark-mode .edit-banner { background: #0b1020; color: #93c5fd; border-top-color: #1e3a5f; border-bottom-color: #1e3a5f; }
html.dark-mode .reply-banner {
  background: #090c13;
  color: #d1d5db;
  border-color: #1f2937;
  border-left-color: #60a5fa;
}
html.dark-mode .reply-to-label { color: #9ca3af; }
html.dark-mode .reply-to-label strong { color: #e5e7eb; }
html.dark-mode .reply-message-preview { color: #e5e7eb; }
html.dark-mode .cancel-edit { color: #93c5fd; }
html.dark-mode .reply-banner .cancel-edit { color: #9ca3af; }
html.dark-mode .reply-cancel-btn:hover { background: #1f2937; color: #e5e7eb; }
html.dark-mode .attachment-preview-banner { background: #0b1a0b; border-top-color: #1a3a1a; border-bottom-color: #1a3a1a; }
html.dark-mode .attachment-thumb { border-color: #374151; }
html.dark-mode .attachment-filename { color: #9ca3af; }
html.dark-mode .attachment-close-x { color: #e5e7eb; }
html.dark-mode .attachment-close-x:hover { color: #e5e7eb; }
html.dark-mode .attachment-close-x:focus,
html.dark-mode .attachment-close-x:active { color: #e5e7eb; }
html.dark-mode input[type="text"],
html.dark-mode input[type="search"],
html.dark-mode input[type="email"],
html.dark-mode input { background: #111111; border-color: #1f2937; color: #e5e7eb; }
html.dark-mode input::placeholder { color: #6b7280; }
html.dark-mode .icon-btn { color: #9ca3af; }
html.dark-mode .icon-btn:hover { background: transparent; }
html.dark-mode .icon-btn:hover { color: #e5e7eb; }
html.dark-mode .icon-btn:hover svg { stroke: currentColor; }
</style>