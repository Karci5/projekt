<template>
  <div :class="['message-wrapper', message.mine ? 'mine' : 'other']">
    <div class="message-avatar">
      <template v-if="avatarSrc && !onAvatarError">
        <img :src="avatarSrc" alt="Avatar" @error="onAvatarError = true" />
      </template>
      <template v-else>
        <span class="avatar-fallback-letter">
          {{ (message.username || message.senderName || 'U')[0].toUpperCase() }}
        </span>
      </template>
    </div>

    <div :class="['message-body', message.mine ? 'mine' : 'other']">
      <div v-if="showSenderName && !message.mine" class="sender-name">{{ senderName }}</div>
      <div
        :class="['message-item', message.mine ? 'mine' : '', hasMedia ? 'has-attachment' : '', (message.message && message.message.replace(/\s/g, '').length <= 6) ? 'short-message' : '']"
        @mouseenter="onHover(true)"
        @mouseleave="onHover(false)"
      >
      <!-- Reply preview box -->
      <div v-if="message.replyTo" class="reply-preview">
        <div class="reply-line"></div>
        <div class="reply-content">
          <span class="reply-header">{{ replyHeaderText }}</span>
          <span class="reply-text">{{ message.replyTo.message }}</span>
        </div>
      </div>

      <template v-if="hasImage || isDataImage">
        <img class="media-preview" :src="mediaSrc" alt="image" @click.stop="openLightbox" style="cursor:pointer" />
      </template>

      <template v-else-if="hasVideo">
        <video class="media-preview" :src="mediaSrc" controls playsinline></video>
      </template>

      <template v-else-if="isYouTube">
        <a :href="message.message" target="_blank" rel="noopener" class="yt-preview">
          <img :src="ytThumb" class="yt-thumb" />
          <div class="yt-play">▶</div>
        </a>
      </template>

      <template v-else>
        <div class="text-content">
          <span v-html="linkedMessage"></span>
          <span v-if="message.edited" class="edited-label">· upravené</span>
        </div>
      </template>

      <div class="actions-area">
        <button class="reply-quick-btn" @click.stop="handleReply" aria-label="Odpovedať">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 14L4 9l5-5"/>
            <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
          </svg>
        </button>
        <button class="dots-btn" @click.stop="toggleMenu" aria-label="Menu">⋮</button>
        <div v-if="menuOpen" class="actions-menu">
          <div v-if="formattedTimeShort" class="actions-time">{{ formattedTimeShort }}</div>
          <button v-if="canCopy && !hasImage && !isDataImage && !hasVideo" class="text-btn" @click.stop="handleCopy">
            <span>Kopírovať</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <template v-if="message.mine">
            <button v-if="!hasMedia" class="text-btn" @click.stop="handleEdit">
              <span>Upraviť</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
            </button>
            <button class="text-btn danger" @click.stop="handleDelete">
              <span>Odstrániť</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </template>
        </div>
      </div>
      </div>
    </div>
  </div>

  <!-- Lightbox overlay -->
  <div
    v-if="lightboxOpen"
    class="lightbox-overlay"
    tabindex="0"
    ref="lightbox"
    @click.self="closeLightbox"
    @keydown.esc="closeLightbox"
  >
    <button class="lightbox-close" @click.stop="closeLightbox" aria-label="Zavrieť">✕</button>
    <img :src="mediaSrc" alt="image" class="lightbox-img" @click.stop />
  </div>
</template>

<script>
export default {
  props: {
    message: { type: Object, required: true },
    showSenderName: { type: Boolean, default: false },
    openMenuId: { type: [String, Number], default: null }
  },
  data() {
    return {
      menuOpen: false,
      lightboxOpen: false,
      onAvatarError: false
    };
  },
  computed: {
    senderName() {
      return this.message?.username || this.message?.senderName || 'Pouzivatel';
    },
    avatarSrc() {
      // Skupinový chat: použij profile_picture, alebo ak nie je, vyskúšaj sender_avatar, senderAvatar
      let pic = this.message?.profile_picture || this.message?.sender_avatar || this.message?.senderAvatar || null;
      if (!pic || typeof pic !== 'string' || pic.trim() === '') return null;
      if (pic && !pic.includes('/uploads/')) {
        // Ak je tam len názov súboru, doplň prefix
        pic = '/uploads/profile_pictures/' + pic;
      }
      return pic;
    },
    normalizedAttachment() {
      const att = this.message && this.message.attachment;
      if (att && typeof att === 'object' && att.type === 'Buffer' && Array.isArray(att.data)) {
        try {
          const text = new TextDecoder().decode(Uint8Array.from(att.data));
          try {
            return JSON.parse(text);
          } catch (e) {
            return text;
          }
        } catch (e) {
          return att;
        }
      }
      return att;
    },
    messageKey() {
      return this.message?.id || this.message?.created_at || this.message?.createdAt || this.message?.timestamp || this.message?.time || null;
    },
    hasMedia() {
      // include direct media (data URLs / direct links) and YouTube previews
      return !!this.normalizedAttachment || this.isDirectMedia || this.isYouTube;
    },
    hasImage() {
      const att = this.normalizedAttachment;
      if (typeof att === 'string' && (att.startsWith('/uploads/images') || att.includes('/uploads/images/'))) return true;
      if (att && att.type === 'image') return true;
      // do NOT return this.isDataImage here, so isDataImage can be handled separately
      return false;
    },
    hasVideo() {
      const att = this.normalizedAttachment;
      if (typeof att === 'string' && /\.(mp4|webm|ogg)(\?|$)/i.test(att)) return true;
      if (att && att.type === 'video') return true;
      return this.isDataVideo || this.isDirectVideoLink;
    },
    mediaSrc() {
      const att = this.normalizedAttachment;
      if (typeof att === 'string') return att;
      if (att) return att.data || att.url || '';
      const text = this.message.message || '';
      if (this.isDataImage || this.isDataVideo) return text;
      return text;
    },
    isDataImage() { return (this.message.message || '').startsWith('data:image'); },
    isDataVideo() { return (this.message.message || '').startsWith('data:video'); },
    isDirectVideoLink() { return /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(this.message.message || ''); },
    isYouTube() {
      const t = this.message.message || '';
      return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(t);
    },
    ytThumb() {
      const id = this.extractYouTubeId(this.message.message || '');
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
    },
    isDirectMedia() {
      return this.isDataImage || this.isDataVideo || this.isDirectVideoLink;
    },
    canCopy() {
      return !!String(this.message?.message || '').trim() || (!!this.hasImage && !!this.mediaSrc);
    },
    formattedTimeShort() {
      const raw = this.message?.created_at || this.message?.createdAt || this.message?.timestamp || this.message?.time;
      if (!raw) return '';
      const date = this.parseMessageDate(raw);
      if (Number.isNaN(date.getTime())) return '';
      const text = new Intl.DateTimeFormat('sk-SK', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
      return text.charAt(0).toUpperCase() + text.slice(1);
    },
    linkedMessage() {
      const text = this.message.message || '';
      const urlRegex = /(https?:\/\/[^\s<]+)/g;
      return text.replace(urlRegex, (url) => {
        const escaped = url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        return `<a href="${escaped}" target="_blank" rel="noopener noreferrer" class="msg-link">${escaped}</a>`;
      });
    },
    replyHeaderText() {
      if (!this.message.replyTo) return '';
      
      const username = this.message.replyTo.username || 'Neznámy';
      
      // Ak je to moja správa (ja odpovedám niekomu)
      if (this.message.mine) {
        const replySenderId = this.message.replyTo.sender_id;
        const myId = this.message.sender_id;
        
        if (replySenderId == myId) {
          return 'Odpovedal si sebe';
        } else {
          return `Odpovedal si používateľovi ${username}`;
        }
      } else {
        // Niekto iný odpovedá
        return `Odpovedal používateľovi ${username}`;
      }
    }
  },
  watch: {
    openMenuId(newVal) {
      if (!this.menuOpen) return;
      if (newVal !== this.messageKey) {
        this.menuOpen = false;
      }
    }
  },
  methods: {
    onHover(val) {
      if (!val && !this.menuOpen) {
        this.menuOpen = false;
      }
    },
    toggleMenu() {
      const next = !this.menuOpen;
      this.menuOpen = next;
      if (next) {
        this.$emit('open-menu', this.messageKey);
      } else {
        this.$emit('open-menu', null);
      }
    },
    extractYouTubeId(url) {
      if (!url) return null;
      const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
      return m ? m[1] : null;
    },
    parseMessageDate(value) {
      if (value instanceof Date) return value;
      const text = String(value || '').trim();
      if (!text) return new Date('');

      // MySQL datetime string without timezone should be interpreted as local time.
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) {
        return new Date(text.replace(' ', 'T'));
      }

      return new Date(text);
    },
    handleEdit() {
      console.log('Edit clicked for message:', this.message);
      this.menuOpen = false;
      this.$emit('open-menu', null);
      this.$emit('edit', this.message);
    },
    handleReply() {
      this.menuOpen = false;
      this.$emit('open-menu', null);
      // Pridám username ak nie je
      const messageWithUsername = {
        ...this.message,
        username: this.message.username || this.message.senderName || 'Neznámy'
      };
      this.$emit('reply', messageWithUsername);
    },
    async handleCopy() {
      if (this.hasImage && this.mediaSrc) {
        const copied = await this.copyImageToClipboard(this.mediaSrc);
        if (!copied) {
          return;
        }
        this.menuOpen = false;
        this.$emit('open-menu', null);
        return;
      }

      const text = String(this.message?.message || '').trim();
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.menuOpen = false;
      this.$emit('open-menu', null);
    },
    async handleInlineImageCopy() {
      if (!this.hasImage || !this.mediaSrc) return;
      await this.copyImageToClipboard(this.mediaSrc);
    },
    async copyImageToClipboard(src) {
      const imageSrc = String(src || '').trim();
      if (!imageSrc) return false;
      try {
        if (!(navigator.clipboard && window.ClipboardItem)) return false;
        const response = await fetch(imageSrc, { mode: 'cors' });
        if (!response.ok) return false;
        const blob = await response.blob();
        let clipboardBlob = blob;
        let mime = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/png';

        // Some browsers fail writing webp directly to clipboard; convert to PNG.
        if (mime === 'image/webp') {
          const bitmap = await createImageBitmap(blob);
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const context = canvas.getContext('2d');
          if (!context) return false;
          context.drawImage(bitmap, 0, 0);
          clipboardBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
          if (!clipboardBlob) return false;
          mime = 'image/png';
        }

        await navigator.clipboard.write([
          new ClipboardItem({ [mime]: clipboardBlob })
        ]);
        return true;
      } catch (_) {
        return false;
      }
    },
    handleDelete() {
      console.log('Delete clicked for message:', this.message);
      this.menuOpen = false;
      this.$emit('open-menu', null);
      this.$emit('delete', this.message);
    },
    openLightbox() {
      this.lightboxOpen = true;
      this.$nextTick(() => {
        if (this.$refs.lightbox) this.$refs.lightbox.focus();
      });
    },
    closeLightbox() {
      this.lightboxOpen = false;
    }
  }
}
</script>

<style scoped>
/* Avatar pri správe */
.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e4e6eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
  overflow: hidden;
}
.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.avatar-fallback-letter {
  font-size: 1.3rem;
  color: #555;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: clamp(6px, 1.5vw, 12px);
  width: 100%;
}

@media (max-width: 600px) {
  .message-wrapper {
    padding-left: 1vw;
    padding-right: 1vw;
    gap: 3px;
  }
  .message-item {
    max-width: 95vw;
    min-width: 36px;
    font-size: 14px;
    padding: 7px 8px;
    border-radius: 13px;
  }
}

@media (max-width: 400px) {
  .message-wrapper {
    padding-left: 0.5vw;
    padding-right: 0.5vw;
  }
  .message-item {
    max-width: 99vw;
    font-size: 13px;
    padding: 4px 4px;
    border-radius: 8px;
  }
}

.message-wrapper.mine {
  justify-content: flex-end;
}

.message-body {
  display: flex;
  flex-direction: column;
  max-width: clamp(70%, 80%, 85%);
  min-width: 0;
}

.message-body.mine {
  align-items: flex-end;
}

.message-body.other {
  align-items: flex-start;
}

.sender-name {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  margin: 0 0 4px 2px;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-avatar svg {
  width: 20px;
  height: 20px;
  color: #666;
}


.message-item {
  background: var(--their-bubble, #e4e6eb);
  color: var(--their-text, #000000);
  padding: 8px 14px;
  border-radius: 18px;
  max-width: 80vw;
  min-width: 48px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  white-space: pre-line;
  overflow-wrap: normal;
  word-break: normal;
  font-size: 15px;
  box-sizing: border-box;
  text-align: left;
  line-height: 1.35;
}

@media (max-width: 600px) {
  .message-item {
    max-width: 95vw;
    min-width: 36px;
    font-size: 14px;
    padding: 7px 8px;
    border-radius: 13px;
    flex-direction: column;
    align-items: flex-start;
  }
}
/* Odstránené rozbité CSS fragmenty, všetko potrebné je už vyššie. */
.message-item.mine {
  background: var(--my-bubble, #1877f2);
  color: var(--my-text, #ffffff);
  align-self: flex-end;
  margin-left: auto;
}

@media (max-width: 400px) {
  .message-item {
    max-width: 99vw;
    font-size: 13px;
    padding: 4px 4px;
    border-radius: 8px;
    flex-direction: column;
    align-items: flex-start;
  }
}

.has-attachment { background:transparent; padding:0; border-radius:8px; width: fit-content; max-width: 320px; }
.media-preview { display:block; width: auto; max-width: 320px; height: auto; max-height: 320px; object-fit:contain; object-position:center; background:#f5f6f8; border-radius:8px }
.yt-preview { position:relative; display:inline-block }
.yt-thumb { display:block; width: 320px; max-width: 320px; height: 220px; object-fit:contain; object-position:center; background:#f5f6f8; border-radius:8px }
.yt-play { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:34px; color:white; text-shadow:0 0 6px rgba(0,0,0,0.6) }
.message-item.mine.has-attachment { background: transparent !important; color: inherit !important; border: none !important; box-shadow: none !important; }
.message-item.has-attachment { padding: 0 !important }
.message-item.has-attachment .media-preview,
.message-item.has-attachment .yt-preview,
.message-item.has-attachment video { background: transparent !important }
.message-item.has-attachment img, .message-item.has-attachment video { display: block; width: auto; max-width: 320px; height: auto; max-height: 320px; object-fit:contain; object-position:center; background:#f5f6f8; border-radius: 8px }

.message-item.mine.has-attachment,
.message-item.mine.has-attachment .media-preview,
.message-item.mine.has-attachment .yt-preview,
.message-item.mine.has-attachment .yt-thumb,
.message-item.mine.has-attachment img,
.message-item.mine.has-attachment video {
  margin-left: auto;
  margin-right: 0;
}

.message-item:not(.mine).has-attachment,
.message-item:not(.mine).has-attachment .media-preview,
.message-item:not(.mine).has-attachment .yt-preview,
.message-item:not(.mine).has-attachment .yt-thumb,
.message-item:not(.mine).has-attachment img,
.message-item:not(.mine).has-attachment video {
  margin-left: 0;
  margin-right: auto;
}
.message-item.has-attachment img:focus, .message-item.has-attachment img:active,
.message-item.has-attachment video:focus, .message-item.has-attachment video:active {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  background: transparent !important;
}


/* Extra reset for 'mine' attachments to ensure no blue background or focus ring */
.message-item.mine.has-attachment .media-preview,
.message-item.mine.has-attachment img,
.message-item.mine.has-attachment video,
.message-item.mine.has-attachment a {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  outline: none !important;
}
:global(.lightbox-overlay) {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
  animation: lb-fadein 0.18s;
}
:global(.lightbox-img) {
  max-width: 96vw;
  max-height: 96vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 48px rgba(0,0,0,0.7);
  cursor: default;
  pointer-events: all;
  background: #222;
  animation: lb-zoom 0.22s cubic-bezier(.4,1.4,.6,1);
}
@keyframes lb-zoom {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes lb-fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}
:global(.lightbox-close) {
  position: absolute;
  top: 18px;
  right: 22px;
  background: rgba(255,255,255,0.15);
  border: none;
  color: #fff;
  font-size: 28px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  z-index: 10000;
}
:global(.lightbox-close:hover) { background: rgba(255,255,255,0.3); }

.message-item.has-attachment a { color: inherit; text-decoration: none }
.message-item.has-attachment a:focus,
.message-item.has-attachment a:focus-visible,
.yt-preview:focus,
.yt-preview:focus-visible { outline: none }
.text-content { padding:4px 0; display:flex; gap:6px; align-items:center; flex-wrap:wrap }
.text-content :deep(.msg-link) { color: inherit; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; word-break: break-all; }
.text-content :deep(.msg-link:hover) { opacity: 0.8; }
.edited-label { font-size:12px; color: rgba(0,0,0,0.5); }

.message-item.mine .edited-label { color: rgba(255,255,255,0.8); }

.message-item { position: relative; }
.actions-area {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 4px;
}
.message-item.mine .actions-area { right: calc(100% + 8px); left: auto; }
.message-item:not(.mine) .actions-area { left: calc(100% + 8px); right: auto; }
.dots-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(0,0,0,0.08);
  color: #000;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.1s, opacity 0.12s;
  opacity: 0;
  pointer-events: none;
}

.reply-quick-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(0,0,0,0.08);
  color: #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.1s, opacity 0.12s;
  opacity: 0;
  pointer-events: none;
  padding: 0;
}

.message-item:hover .dots-btn,
.message-item:hover .reply-quick-btn {
  opacity: 1;
  pointer-events: auto;
}

.dots-btn:hover { background: rgba(0,0,0,0.12); }
.dots-btn:active { transform: scale(0.95); }
.reply-quick-btn:hover { background: rgba(0,0,0,0.12); }
.reply-quick-btn:active { transform: scale(0.95); }

.actions-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 16px 38px rgba(17, 24, 39, 0.2);
  display: flex;
  flex-direction: column;
  min-width: 170px;
  width: max-content;
  max-width: min(220px, calc(100vw - 16px));
  z-index: 40;
  overflow: visible;
  padding: 10px;
}

.message-item.mine .actions-menu {
  left: -100px;
  right: auto;
}

.message-item:not(.mine) .actions-menu {
  right: 0;
  left: auto;
}

.actions-time {
  padding: 8px 10px 10px 10px;
  font-size: 12px;
  color: #6b7280;
  border-bottom: 1px solid #eef0f3;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.01em;
  margin-bottom: 8px;
}

.text-btn {
  background: #f3f4f6;
  border: none;
  text-align: center;
  padding: 11px 12px;
  font-size: 15px;
  color: #111827;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  border-radius: 11px;
  position: relative;
}

.text-btn span {
  text-align: center;
}

.text-btn svg {
  width: 18px;
  height: 18px;
  opacity: 0.85;
  flex-shrink: 0;
}

.text-btn + .text-btn {
  margin-top: 8px;
}

.text-btn:hover {
  background: #e9ebef;
  transform: translateY(-1px);
}

.text-btn:active {
  transform: translateY(0);
}

.text-btn.danger {
  color: #c0392b;
  background: #fff3f2;
}

.text-btn.danger:hover {
  background: #ffe6e3;
  transform: translateY(-1px);
}

/* Reply preview styles - Messenger style */
.reply-preview {
  display: flex;
  gap: 6px;
  padding: 6px 0 6px 8px;
  margin-bottom: 6px;
  background: transparent !important;
  border-left: 3px solid currentColor;
  border-radius: 0;
  font-size: 12px;
  max-width: 100%;
  color: inherit;
}

.message-item.mine .reply-preview {
  border-left-color: rgba(255, 255, 255, 0.5);
}

.message-item:not(.mine) .reply-preview {
  border-left-color: rgba(0, 0, 0, 0.25);
}

.reply-line {
  display: none !important;
}

.reply-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.reply-header {
  font-weight: 600;
  opacity: 0.9;
  font-size: 11px;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reply-text {
  opacity: 0.95;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  line-height: 1.2;
}

/* Force-remove focus outline/background only on media elements */
.message-item.has-attachment img,
.message-item.has-attachment video,
.message-item.has-attachment .media-preview,
.message-item.has-attachment .yt-preview,
.message-item.has-attachment .yt-thumb {
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

@media (max-width: 1024px) {
  .message-item { max-width:70% }
  .media-preview { width: auto; max-width: min(300px, 55vw); height: auto; max-height: 260px }
  .yt-thumb { width: min(300px, 55vw); height: 200px }
  .message-avatar { width: 28px; height: 28px }
}

@media (max-width: 768px) {
  .message-item { max-width:85%; padding:6px 10px; font-size:13px }
  .media-preview { width: auto; max-width: min(280px, 75vw); height: auto; max-height: 220px }
  .yt-thumb { width: min(280px, 75vw); height: 180px }
  .yt-play { font-size:28px }
}

@media (max-width: 480px) {
  .message-item { max-width:90%; padding:5px 8px; font-size:12px; border-radius:8px }
  .media-preview { width: auto; max-width: min(240px, 85vw); height: auto; max-height: 190px; border-radius:6px }
  .yt-thumb { width: min(240px, 85vw); height: 160px; border-radius:6px }
  .yt-play { font-size:24px }
  .text-content { padding:2px 0 }
}

/* ===== DARK MODE ===== */
html.dark-mode .message-avatar {
  background: #111111;
}

html.dark-mode .message-avatar svg {
  color: #9ca3af;
}

html.dark-mode .edited-label {
  color: rgba(255, 255, 255, 0.4);
}

html.dark-mode .dots-btn,
html.dark-mode .reply-quick-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

html.dark-mode .dots-btn:hover,
html.dark-mode .reply-quick-btn:hover {
  background: rgba(255, 255, 255, 0.14);
}

html.dark-mode .actions-menu {
  background: #0b0b0b;
  border-color: #1f2937;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

html.dark-mode .actions-time {
  color: #9ca3af;
  border-bottom-color: #1f2937;
}

html.dark-mode .text-btn {
  color: #e5e7eb;
}

html.dark-mode .text-btn:hover {
  background: #111111;
}

html.dark-mode .text-btn.danger {
  color: #f87171;
}

html.dark-mode .text-btn.danger:hover {
  background: rgba(220, 38, 38, 0.12);
}

html.dark-mode .media-preview,
html.dark-mode .yt-thumb {
  background: #111111;
}

html.dark-mode .reply-preview {
  border-left-color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 900px) {
  .actions-menu {
    min-width: 140px;
    width: max-content;
    max-width: min(200px, calc(100vw - 16px));
    padding: 8px;
  }

  .has-attachment {
    width: min(320px, 78vw);
    max-width: min(320px, 78vw);
  }

  .media-preview,
  .message-item.has-attachment img,
  .message-item.has-attachment video,
  .yt-thumb {
    max-width: min(320px, 78vw);
    width: auto;
  }
}

</style>
