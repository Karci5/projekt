<template>
  <div class="groups-list">
    <div class="header">
      <h4>Skupiny</h4>
      <button class="create-btn" @click="$emit('create-group')" title="Vytvoriť skupinu">
        <span class="create-icon">+</span>
        <span class="create-text">Nová</span>
      </button>
    </div>
    <div v-if="groups.length === 0" class="empty">Žiadne skupiny</div>
    <div
      v-for="group in groups"
      :key="group.id"
      class="group-item"
      @click="$emit('select', group)"
    >
      <div class="group-avatar" @click.stop="openGroupAvatar(group)">
        <img v-if="group.avatar || group.profile_picture || group.group_avatar" :src="group.avatar || group.profile_picture || group.group_avatar" alt="group avatar" />
        <span v-else>{{ group.name ? group.name[0].toUpperCase() : '?' }}</span>
      </div>
      <div class="group-info">
        <div class="group-name">{{ group.name }}</div>
        <div class="group-members">{{ group.member_count }} členov</div>
      </div>
    </div>

    <div v-if="previewSrc" class="avatar-preview-overlay" @click="previewSrc = ''">
      <div class="avatar-preview-box" @click.stop>
        <button class="avatar-preview-close" @click="previewSrc = ''" aria-label="Zavrieť">✕</button>
        <img :src="previewSrc" alt="group avatar" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    groups: { type: Array, default: () => [] }
  },
  emits: ['select', 'create-group'],
  data() {
    return {
      previewSrc: ''
    };
  },
  methods: {
    openGroupAvatar(group) {
      if (!group?.avatar) return;
      this.previewSrc = group.avatar;
    }
  }
}
</script>

<style scoped>
.groups-list { display: flex; flex-direction: column; gap: 8px; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 0 8px; }
.header h4 { margin: 0; font-size: 14px; color: #666; }
.create-btn {
  height: 28px;
  border-radius: 999px;
  border: none;
  background: #1877f2;
  color: white;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
  padding: 0 10px 0 8px;
  box-shadow: 0 2px 6px rgba(24, 119, 242, 0.25);
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
}
.create-btn:hover { background: #166fe5; box-shadow: 0 3px 8px rgba(24, 119, 242, 0.3); }
.create-btn:active { transform: translateY(1px); }
.create-icon { font-size: 18px; line-height: 1; }
.create-text { font-weight: 600; }

@media (max-width: 480px) {
  .create-btn { padding: 0 8px; }
  .create-text { display: none; }
}

.empty { text-align: center; padding: 20px; color: #999; font-size: 13px; }

.group-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.group-item:hover { background: #f0f2f5; }

.group-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e4e6eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  overflow: hidden;
}
.group-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-members {
  font-size: 12px;
  color: #65676b;
}

/* ===== DARK MODE ===== */
html.dark-mode .header h4 { color: #9ca3af; }
html.dark-mode .create-btn { background: #2563eb; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3); }
html.dark-mode .create-btn:hover { background: #3b82f6; }
html.dark-mode .empty { color: #6b7280; }
html.dark-mode .group-item:hover { background: #0b0b0b; }
html.dark-mode .group-avatar { background: #111111; }
html.dark-mode .group-name { color: #e5e7eb; }
html.dark-mode .group-members { color: #9ca3af; }

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
</style>
