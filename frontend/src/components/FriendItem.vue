<template>
  <div class="friend" @click="$emit('select', friend)">
    <div class="friend-left">
      <div class="avatar" :class="{ 'has-image': !!friend.profile_picture }" @click.stop="openAvatarPreview">
        <img v-if="friend.profile_picture" :src="friend.profile_picture" alt="avatar" />
        <div v-else class="avatar-placeholder">{{ initials }}</div>
        <span v-if="showPresence" :class="['avatar-presence-dot', friendPresence && friendPresence.isOnline ? 'online' : 'offline']"></span>
      </div>
      <div class="friend-info">
        <div class="name-row">
          <span class="name">{{ displayName }}</span>
        </div>
        <div v-if="isPinned || isMuted || isBlocked || (showAdd && isFriend)" class="status-row">
          <span v-if="isPinned" class="pin-badge">Pripnutý</span>
          <span v-if="isMuted" class="mute-badge">Stíšený</span>
          <span v-if="isBlocked" class="blocked-badge">Blokovaný</span>
          <span v-if="showAdd && isFriend" class="badge">Kamarát</span>
        </div>
        <span v-if="note" class="note">{{ note }}</span>
        <span v-if="showPresence" class="presence-text">{{ presenceLabel }}</span>
      </div>
    </div>
    <div class="actions">
      <button v-if="showAdd && !isFriend" @click.stop="$emit('add', friend)">+ Pridať</button>
      <button
        v-if="showOptions && isFriend"
        class="more-btn"
        @click.stop="toggleMenu"
        aria-label="Možnosti"
      >⋮</button>
      <div v-if="menuOpen && showOptions && isFriend" class="item-menu" @click.stop>
        <button @click="emitAndClose('toggle-pin')">{{ isPinned ? 'Odopnúť' : 'Pripnúť navrch' }}</button>
        <button @click="emitAndClose('toggle-mute')">{{ isMuted ? 'Zapnúť notifikácie' : 'Stíšiť notifikácie' }}</button>
        <button @click="emitAndClose('toggle-block')" class="danger">{{ isBlocked ? 'Odblokovať' : 'Blokovať' }}</button>
        <button @click="emitAndClose('remove-friend')" class="danger">Odstrániť priateľa</button>
      </div>
    </div>
  </div>

  <div v-if="avatarPreviewOpen && friend.profile_picture" class="avatar-preview-overlay" @click="avatarPreviewOpen = false">
    <div class="avatar-preview-box" @click.stop>
      <button class="avatar-preview-close" @click="avatarPreviewOpen = false" aria-label="Zavrieť">✕</button>
      <img :src="friend.profile_picture" :alt="friend.username || 'avatar'" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    friend: { type: Object, required: true },
    showAdd: { type: Boolean, default: false },
    isFriend: { type: Boolean, default: false },
    nicknames: { type: Object, default: () => ({}) },
    notes: { type: Object, default: () => ({}) },
    showOptions: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    showPresence: { type: Boolean, default: false },
    friendPresence: { type: Object, default: null }
  },
  data() {
    return {
      avatarPreviewOpen: false,
      menuOpen: false
    };
  },
  computed: {
    initials() {
      const name = this.friend?.username || '';
      return name.trim().slice(0, 2).toUpperCase() || '??';
    },
    nickname() {
      return this.nicknames && this.nicknames[this.friend.id] ? this.nicknames[this.friend.id] : '';
    },
    note() {
      return this.notes && this.notes[this.friend.id] ? this.notes[this.friend.id] : '';
    },
    presenceLabel() {
      if (!this.friendPresence) return 'Nedostupné';
      if (this.friendPresence.isOnline) return 'Online';
      if (!this.friendPresence.lastActive) return 'Offline';
      const d = new Date(this.friendPresence.lastActive);
      if (Number.isNaN(d.getTime())) return 'Offline';

      const diffMs = Date.now() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMin < 1) return 'Aktívny práve teraz';
      if (diffMin < 60) return `Aktívny pred ${diffMin} min`;
      if (diffHrs < 24) return `Aktívny pred ${diffHrs} h`;
      if (diffDays < 7) return `Aktívny pred ${diffDays} d`; 

      return `Aktívny ${d.toLocaleDateString('sk-SK')}`;
    },
    displayName() {
      return this.friend?.username || '';
    }
  }
  ,
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
    emitAndClose(eventName) {
      this.menuOpen = false;
      this.$emit(eventName, this.friend);
    },
    openAvatarPreview() {
      if (!this.friend?.profile_picture) return;
      this.avatarPreviewOpen = true;
    }
  }
};
</script>

<style scoped>
.friend { display:flex; justify-content:space-between; gap:8px; padding:8px; cursor:pointer; align-items:center; border-radius:8px; position:relative; }
.friend:hover { background:#eee }
.friend-left { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
.friend-info { display:flex; flex-direction:column; gap:2px; min-width:0; }
.name-row { display:flex; align-items:center; gap:6px; }
.avatar { width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-weight:600; color:#555; font-size:12px; }
.avatar { position: relative; }
.avatar.has-image { border-radius:50%; overflow:hidden; background:#f2f3f5; border:1px solid #e0e0e0; }
.avatar:not(.has-image) { background: transparent; border: none; }
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.avatar-placeholder { padding-top:2px; }
.name { font-size:14px; color:#111; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.nickname { font-size:12px; color:#65676b; }
.note { font-size:11px; color:#6b7280; }
.presence-text { font-size:11px; color:#6b7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.status-row { display:flex; align-items:center; flex-wrap:wrap; gap:4px; margin-top:1px; }
.actions { display:flex; align-items:center; gap:6px; flex-shrink:0; }
.pin-badge { background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:12px; font-size:11px; }
.mute-badge { background:#ede9fe; color:#5b21b6; padding:2px 8px; border-radius:12px; font-size:11px; }
.blocked-badge { background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:12px; font-size:11px; }
.badge { background:#e5f4ff; color:#1877f2; padding:2px 8px; border-radius:12px; font-size:12px }
button { padding:4px 8px; border-radius:8px; border:1px solid #1877f2; background:#1877f2; color:white; cursor:pointer }
.more-btn { width: 30px; height: 30px; padding: 0; border: 1px solid #d1d5db; background: #fff; color: #111; border-radius: 8px; }

@media (max-width: 480px) {
  .friend { padding: 7px 6px; }
  .friend-left { gap: 8px; }
  .avatar { width: 34px; height: 34px; }
  .name { font-size: 13px; }
  .presence-text { font-size: 10px; }
  .pin-badge, .mute-badge, .blocked-badge, .badge {
    font-size: 10px;
    padding: 2px 6px;
  }
  .actions { gap: 4px; }
  .more-btn { width: 28px; height: 28px; }
}

.item-menu {
  position: absolute;
  right: 6px;
  top: 40px;
  min-width: 190px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.16);
  z-index: 50;
  display: flex;
  flex-direction: column;
  padding: 6px;
}

.item-menu button {
  border: none;
  background: transparent;
  color: #111827;
  text-align: left;
  border-radius: 8px;
  padding: 9px 10px;
  font-size: 13px;
}

.item-menu button:hover { background: #f3f4f6; }
.item-menu button.danger { color: #b91c1c; }

.avatar-presence-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  position: absolute;
  right: 3px;
  bottom: 0;
  border: 2px solid #fff;
  box-sizing: content-box;
}
.avatar-presence-dot.online { background: #22c55e; }
.avatar-presence-dot.offline { background: #9ca3af; }

.avatar-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 20px;
}

.avatar-preview-box {
  position: relative;
  width: min(86vw, 540px);
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  clip-path: circle(50% at 50% 50%);
  background: #111;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.avatar-preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.avatar-preview-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== DARK MODE ===== */
html.dark-mode .friend:hover { background: #0b0b0b; }
html.dark-mode .avatar { color: #cbd5f5; }
html.dark-mode .avatar.has-image { background: #111111; border-color: #1f2937; }
html.dark-mode .name { color: #e5e7eb; }
html.dark-mode .nickname { color: #9ca3af; }
html.dark-mode .note,
html.dark-mode .presence-text { color: #94a3b8; }
html.dark-mode .badge { background: rgba(96, 165, 250, 0.15); color: #93c5fd; }
html.dark-mode .pin-badge { background: rgba(180, 83, 9, 0.22); color: #fcd34d; }
html.dark-mode .mute-badge { background: rgba(91, 33, 182, 0.22); color: #c4b5fd; }
html.dark-mode .blocked-badge { background: rgba(185, 28, 28, 0.22); color: #fca5a5; }
html.dark-mode .more-btn { background: #0b0b0b; color: #e5e7eb; border-color: #1f2937; }
html.dark-mode .item-menu { background: #0b0b0b; border-color: #1f2937; }
html.dark-mode .item-menu button { color: #e5e7eb; }
html.dark-mode .item-menu button:hover { background: #111111; }
html.dark-mode .avatar-presence-dot { border-color: #0b0b0b; }
</style>