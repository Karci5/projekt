/* Overlay pre zväčšený avatar */
.avatar-preview-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(60, 60, 60, 0.85);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview-box {
  position: relative;
  background: transparent;
  border-radius: 50%;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  max-width: 80vw;
  max-height: 80vh;
}

.avatar-preview-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #fff;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10000;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
<template>
  <div class="chat">
    <div v-if="!activeGroup" class="empty-chat">Vyber skupinu</div>
    <div v-else class="chat-window">
      <div class="chat-header">
        <div class="group-header-left">
          <button class="back-btn" @click="$emit('close-chat')" aria-label="Späť">
            <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button
            v-if="displayedGroupAvatar"
            class="group-avatar-btn"
            @click.stop="openGroupAvatar"
            aria-label="Zväčšiť fotku skupiny"
          >
            <img :src="displayedGroupAvatar" alt="" />
          </button>
          <span>{{ activeGroup.name }}</span>
        </div>
        <div class="header-menu">
          <button class="header-dots-btn" @click.stop="toggleHeaderMenu" aria-label="Menu">⋮</button>
        </div>
      </div>

      <!-- Overlay pre zväčšený avatar (funguje aj z navbaru) -->
      <div v-if="avatarPreviewSrc" class="avatar-preview-overlay" @click="avatarPreviewSrc = ''">
        <div class="avatar-preview-box" @click.stop>
          <button class="avatar-preview-close" @click="avatarPreviewSrc = ''" aria-label="Zavrieť">✕</button>
          <img :src="avatarPreviewSrc" alt="group avatar" />
        </div>
      </div>

      <!-- Side panel -->
      <transition name="panel-slide">
        <div v-if="headerMenuOpen" class="side-panel" @click.stop>
          <div class="side-panel-header">
            <h3>Nastavenia skupiny</h3>
            <span class="side-panel-close" role="button" tabindex="-1" @click="headerMenuOpen = false">✕</span>
          </div>
          <div class="side-panel-avatar">
            <button v-if="isGroupAdmin" class="side-panel-avatar-btn" @click="triggerAvatarSelect">
              <img v-if="displayedGroupAvatar" :src="displayedGroupAvatar" alt="" />
              <span v-else class="avatar-placeholder">{{ activeGroup.name ? activeGroup.name[0].toUpperCase() : '?' }}</span>
            </button>
            <button v-else class="side-panel-avatar-btn" @click.stop="openGroupAvatar">
              <img v-if="displayedGroupAvatar" :src="displayedGroupAvatar" alt="" />
              <span v-else class="avatar-placeholder">{{ activeGroup.name ? activeGroup.name[0].toUpperCase() : '?' }}</span>
            </button>
                <div v-if="avatarPreviewSrc" class="avatar-preview-overlay" @click="avatarPreviewSrc = ''">
                  <div class="avatar-preview-box" @click.stop>
                    <button class="avatar-preview-close" @click="avatarPreviewSrc = ''" aria-label="Zavrieť">✕</button>
                    <img :src="avatarPreviewSrc" alt="group avatar" />
                  </div>
                </div>
            <div class="side-panel-group-name">{{ activeGroup.name }}</div>
            <div v-if="pendingGroupAvatarData" class="avatar-preview-actions">
              <button class="side-panel-avatar-apply" @click="applyGroupAvatar">Použiť obrázok</button>
              <button class="side-panel-avatar-cancel" @click="cancelGroupAvatarPreview">Zrušiť</button>
            </div>
          </div>
          <div class="side-panel-items">
            <button class="side-panel-btn" @click.stop="openMembers">
              <span class="sp-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
              <span>Členovia</span>
            </button>
            <button class="side-panel-btn" @click.stop="openThemes">
              <span class="sp-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg></span>
              <span>Motívy</span>
            </button>
            <button class="side-panel-btn" @click.stop="openNicknamesDialog">
              <span class="sp-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span>
              <span>Prezývky</span>
            </button>
            <button class="side-panel-btn" @click.stop="toggleMuteGroup">
              <span class="sp-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M22 9l-6 6"/><path d="M16 9l6 6"/></svg></span>
              <span>{{ isMuted ? 'Zrušiť stíšenie' : 'Stíšiť skupinu' }}</span>
            </button>
            <button class="side-panel-btn danger" @click.stop="leaveGroup">
              <span class="sp-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span>
              <span>Opustiť skupinu</span>
            </button>
          </div>
        </div>
      </transition>

      <input
        v-if="isGroupAdmin"
        type="file"
        ref="groupAvatarInput"
        accept="image/*"
        style="display: none"
        @change="handleGroupAvatarChange"
      />

      <MessagesList
        ref="messagesList"
        :messages="messagesWithAvatars"
        :show-sender-name="true"
        :is-group="true"
        @edit="startEdit"
        @delete="deleteMessage"
        @reply="startReply"
      />

      <MessageInput
        :value="inputValue"
        :is-editing="!!editingMessage"
        :reply-to="replyToMessage"
        @send="handleSend"
        @cancel-edit="cancelEdit"
        @cancel-reply="cancelReply"
      />
    </div>

    <!-- Modal členov -->
    <div v-if="showMembers" class="modal-overlay" @click="showMembers = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Členovia skupiny</h3>
          <button class="modal-close-x" @click="showMembers = false" aria-label="Zavrieť">✕</button>
        </div>
        <div class="members-list">
          <div v-for="member in members" :key="member.id" class="member-item">
            <div class="member-avatar">
              <img v-if="member.profile_picture" :src="member.profile_picture" alt="" />
              <span v-else>{{ member.username[0].toUpperCase() }}</span>
            </div>
            <div class="member-meta-row">
              <span class="member-name">{{ member.username }}</span>
              <span
                v-if="isOwnerMember(member)"
                class="member-role-badge owner-badge"
                style="margin-left: 8px"
              >
                Vlastník<span v-if="String(member.id) === String(currentUserId)"> (ty)</span>
              </span>
              <span
                v-else-if="isAdminMember(member)"
                class="member-role-badge"
                style="margin-left: 8px"
              >
                Admin<span v-if="String(member.id) === String(currentUserId)"> (ty)</span>
              </span>
            </div>
            <button
              v-if="canDemoteMember(member)"
              class="member-demote-btn"
              @click="demoteMember(member)"
            >
              Znížiť
            </button>
            <button
              v-if="canPromoteMember(member)"
              class="member-promote-btn"
              @click="promoteMember(member)"
            >
              Povýšiť
            </button>
            <button
              v-if="canRemoveMember(member)"
              class="member-remove-btn"
              @click="removeMember(member)"
            >
              Odstrániť
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Prezývky dialog -->
    <div v-if="showNicknamesDialog" class="dialog-overlay" @click="showNicknamesDialog = false">
      <div class="dialog-box nicknames-dialog" @click.stop>
        <div class="dialog-header">
          <h3>Prezývky</h3>
          <button @click="showNicknamesDialog = false" class="modal-close-x" aria-label="Zavrieť">✕</button>
        </div>
        <div class="nicknames-list">
          <div v-for="member in allMembers" :key="member.id" class="nickname-item">
            <div class="nickname-avatar">
              <img v-if="member.profile_picture" :src="member.profile_picture" :alt="member.username" />
              <div v-else class="default-avatar">👤</div>
            </div>
            <div class="nickname-info">
              <div class="nickname-username">{{ member.username }}</div>
              <template v-if="editingNicknameFor && editingNicknameFor.id === member.id">
                <input
                  :ref="`nicknameInput-${member.id}`"
                  v-model="nicknameEditInput"
                  class="nickname-inline-input"
                  type="text"
                  placeholder="Zadaj prezývku"
                  @keyup.enter="saveNicknameEdit"
                  @keyup.esc="cancelNicknameEdit"
                />
              </template>
              <div v-else class="nickname-display">{{ getNicknameFor(member.id) || 'Bez prezývky' }}</div>
            </div>
            <template v-if="editingNicknameFor && editingNicknameFor.id === member.id">
              <button @click="saveNicknameEdit" class="edit-btn save-inline" aria-label="Uložiť">✓</button>
              <button @click="cancelNicknameEdit" class="edit-btn cancel-inline" aria-label="Zrušiť">✕</button>
            </template>
            <button v-else @click="editNickname(member)" class="edit-btn" aria-label="Upraviť prezývku">✎</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MessagesList from './MessagesList.vue'
import MessageInput from './MessageInput.vue'

export default {
  props: { 
    activeGroup: Object, 
    messages: Array,
    members: Array,
    nicknames: Object,
    currentUserId: [String, Number],
    canEditTheme: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false }
  },
  emits: ['send', 'edit', 'delete', 'reply', 'open-themes', 'update-nickname', 'update-group-avatar', 'leave-group', 'remove-member', 'promote-member', 'demote-member', 'toggle-mute-group', 'close-chat'],
  components: { MessagesList, MessageInput },
  data() {
    return {
      editingMessage: null,
      inputValue: '',
      showMembers: false,
      replyToMessage: null,
      headerMenuOpen: false,
      showNicknamesDialog: false,
      editingNicknameFor: null,
      nicknameEditInput: '',
      pendingGroupAvatarData: null,
      avatarPreviewSrc: '',
      addMemberInput: ''
    }
  },
      openGroupAvatar() {
        console.log('openGroupAvatar called, displayedGroupAvatar:', this.displayedGroupAvatar);
        if (this.displayedGroupAvatar) {
          this.avatarPreviewSrc = this.displayedGroupAvatar;
          console.log('avatarPreviewSrc set:', this.avatarPreviewSrc);
        } else if (this.activeGroup && this.activeGroup.name) {
          // fallback: zobraz písmeno v overlayi
          this.avatarPreviewSrc = '';
          console.log('No avatar image, fallback to letter:', this.activeGroup.name[0].toUpperCase());
        }
      },
  computed: {
    allMembers() {
      return this.members || [];
    },
    displayedGroupAvatar() {
      return this.pendingGroupAvatarData || (this.activeGroup && this.activeGroup.avatar) || null;
    },
    isGroupAdmin() {
      if (!this.activeGroup) return false;
      if (String(this.activeGroup.created_by) === String(this.currentUserId)) return true;
      const me = (this.members || []).find(m => String(m.id) === String(this.currentUserId));
      return !!(me && (me.role === 'admin' || Number(me.is_admin) === 1));
    },
    messagesWithAvatars() {
      // Obohatí každú správu o profilovku podľa sender_id a zabezpečí správnu cestu
      if (!Array.isArray(this.messages) || !Array.isArray(this.members)) return this.messages;
      const enriched = this.messages.map(msg => {
        if (msg.mine) return msg;
        const sender = this.members.find(m => String(m.id) === String(msg.sender_id));
        let profile_picture = msg.profile_picture || (sender && sender.profile_picture) || '';
        // Ak je len názov súboru, pridaj prefix
        if (profile_picture && typeof profile_picture === 'string' && !profile_picture.includes('/uploads/')) {
          profile_picture = '/uploads/profile_pictures/' + profile_picture;
        }
        return {
          ...msg,
          profile_picture,
          username: msg.username || (sender && sender.username) || '',
        };
      });
      // Debug výpis do konzoly
      if (enriched && enriched.length > 0) {
        // vypíš len prvých 5 správ pre prehľadnosť
        console.log('[DEBUG] messagesWithAvatars (first 5):', enriched.slice(0, 5));
      }
      return enriched;
    }
  },
  watch: {
    activeGroup() {
      this.pendingGroupAvatarData = null;
    }
  },
  methods: {
        onAddMemberInput() {
          // Prípadne môžeš pridať debounce/search logiku
        },
        addMember() {
          if (this.addMemberInput.length < 3) return;
          this.$emit('add-member', this.addMemberInput);
          this.addMemberInput = '';
        },
    startEdit(msg) {
      this.editingMessage = msg;
      this.inputValue = msg.message || '';
    },
    startReply(msg) {
      // Dohľadaj username z members podľa sender_id
      const sender = this.members && this.members.find(m => m.id === msg.sender_id);
      const enrichedMsg = {
        ...msg,
        username: msg.username || (sender && sender.username) || 'Neznámy'
      };
      this.replyToMessage = enrichedMsg;
      this.$emit('reply', enrichedMsg);
    },
    cancelEdit() {
      this.editingMessage = null;
      this.inputValue = '';
    },
    cancelReply() {
      this.replyToMessage = null;
    },
    handleSend(payload) {
      // if editing and payload is text, route as edit
      if (this.editingMessage && typeof payload === 'string') {
        this.$emit('edit', { ...this.editingMessage, message: payload });
        this.cancelEdit();
        return;
      }

      this.$emit('send', payload);
      this.inputValue = '';
      this.replyToMessage = null;
      this.$nextTick(() => {
        const list = this.$refs.messagesList;
        if (list && typeof list.jumpToLatest === 'function') list.jumpToLatest();
      });
    },
    deleteMessage(msg) {
      this.$emit('delete', msg);
    },
    toggleHeaderMenu() {
      this.headerMenuOpen = !this.headerMenuOpen;
    },
    openMembers() {
      this.showMembers = true;
      this.headerMenuOpen = false;
    },
    openThemes() {
      this.headerMenuOpen = false;
      this.$emit('open-themes');
    },
    openNicknamesDialog() {
      this.showNicknamesDialog = true;
      this.headerMenuOpen = false;
      this.editingNicknameFor = null;
    },
    editNickname(member) {
      this.editingNicknameFor = member;
      this.nicknameEditInput = this.getNicknameFor(member.id) || '';
      this.$nextTick(() => {
        const ref = this.$refs[`nicknameInput-${member.id}`];
        const input = Array.isArray(ref) ? ref[0] : ref;
        if (input && typeof input.focus === 'function') input.focus();
      });
    },
    cancelNicknameEdit() {
      this.editingNicknameFor = null;
      this.nicknameEditInput = '';
    },
    saveNicknameEdit() {
      if (this.editingNicknameFor) {
        this.$emit('update-nickname', {
          friendId: this.editingNicknameFor.id,
          nickname: this.nicknameEditInput
        });
        this.editingNicknameFor = null;
        this.nicknameEditInput = '';
      }
    },
    getNicknameFor(memberId) {
      return (this.nicknames && this.nicknames[memberId]) || '';
    },
    toggleMuteGroup() {
      this.headerMenuOpen = false;
      this.$emit('toggle-mute-group', this.activeGroup);
    },
    leaveGroup() {
      this.headerMenuOpen = false;
      this.$emit('leave-group');
    },
    canRemoveMember(member) {
      if (!this.isGroupAdmin || !member) return false;
      if (String(member.id) === String(this.currentUserId)) return false;
      if (this.activeGroup && String(member.id) === String(this.activeGroup.created_by)) return false;
      return true;
    },
    isOwnerMember(member) {
      if (!member || !this.activeGroup) return false;
      return String(member.id) === String(this.activeGroup.created_by);
    },
    isAdminMember(member) {
      if (!member) return false;
      // vlastník má vlastný badge, nie admin badge
      if (this.activeGroup && String(member.id) === String(this.activeGroup.created_by)) return false;
      return member.role === 'admin' || Number(member.is_admin) === 1;
    },
    canPromoteMember(member) {
      if (!this.isGroupAdmin || !member) return false;
      if (this.isOwnerMember(member)) return false;
      if (this.isAdminMember(member)) return false;
      return true;
    },
    canDemoteMember(member) {
      if (!this.isGroupAdmin || !member) return false;
      if (this.isOwnerMember(member)) return false;
      if (!this.isAdminMember(member)) return false;
      if (String(member.id) === String(this.currentUserId)) return false;
      return true;
    },
    promoteMember(member) {
      if (!member) return;
      this.$emit('promote-member', member);
    },
    demoteMember(member) {
      if (!member) return;
      this.$emit('demote-member', member);
    },
    removeMember(member) {
      if (!member) return;
      this.$emit('remove-member', member);
    },
    triggerAvatarSelect() {
      if (this.$refs.groupAvatarInput) this.$refs.groupAvatarInput.click();
    },
    applyGroupAvatar() {
      if (!this.pendingGroupAvatarData) return;
      this.$emit('update-group-avatar', this.pendingGroupAvatarData);
      this.pendingGroupAvatarData = null;
    },
    cancelGroupAvatarPreview() {
      this.pendingGroupAvatarData = null;
      if (this.$refs.groupAvatarInput) this.$refs.groupAvatarInput.value = '';
    },
    handleGroupAvatarChange(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('Obrázok je príliš veľký. Maximálna veľkosť je 5MB.');
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target && e.target.result ? e.target.result : null;
        if (dataUrl) this.pendingGroupAvatarData = dataUrl;
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    }
  }
}
</script>

<style scoped>
.chat { flex:1; display:flex; flex-direction:column; min-height:0 }
.chat-window { flex:1; display:flex; flex-direction:column; min-height:0; position: relative; overflow: hidden; }
.chat-header { 
  height:80px;
  padding:0 15px;
  box-sizing:border-box;
  background:white; 
  border-bottom:1px solid #ddd; 
  font-weight:bold; 
  font-size:20px; 
  display:flex; 
  align-items:center; 
  justify-content:space-between 
}
.group-header-left { display:flex; align-items:center; gap:10px; }
.back-btn {
  display: none;
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 0;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #111827;
  appearance: none;
  -webkit-tap-highlight-color: transparent;
  align-items: center;
  justify-content: center;
}
.back-btn:hover { background: rgba(0,0,0,0.06); }
.back-icon { width: 18px; height: 18px; }
.group-avatar-btn {
  width:36px;
  height:36px;
  border-radius:50%;
  border:none;
  background:#e4e6eb;
  padding:0;
  overflow:hidden;
  cursor:pointer;
  flex-shrink:0;
}
.group-avatar-btn img { width:100%; height:100%; object-fit:cover; }
.empty-chat { margin:auto; color:#777 }

.header-menu { position:relative }
.header-dots-btn {
  color:#000;
  width:34px;
  height:34px;
  border-radius:50%;
  border:none;
  background:transparent;
  font-size:20px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:background 0.15s;
}
.header-dots-btn:focus,
.header-dots-btn:focus-visible,
.header-dots-btn:hover,
.header-dots-btn:active {
  outline: none;
  box-shadow: none;
  background: transparent;
}

/* Side panel */
.side-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  max-width: 100%;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e4e6eb;
  box-shadow: -4px 0 16px rgba(0,0,0,0.08);
  z-index: 90;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-sizing: border-box;
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.25s ease;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(100%);
}

.side-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid #e4e6eb;
}
.side-panel-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.side-panel-close {
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #000;
  cursor: pointer;
  font-size: 20px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  box-sizing: border-box;
  flex-shrink: 0;
}
.side-panel-close:hover { background: transparent; }
.side-panel-close:focus,
.side-panel-close:focus-visible,
.side-panel-close:active { outline: none; box-shadow: none; }

.side-panel-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 16px;
  gap: 10px;
}
.side-panel-avatar-btn {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: none;
  background: #e4e6eb;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  color: #65676b;
  transition: opacity 0.15s;
  padding: 0;
}
.side-panel-avatar-btn:hover { opacity: 0.85; }
.side-panel-avatar-btn img { width: 100%; height: 100%; object-fit: contain; }
.avatar-placeholder { pointer-events: none; }
.side-panel-group-name {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  word-break: break-word;
}

.avatar-preview-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.side-panel-avatar-apply,
.side-panel-avatar-cancel {
  border: none;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.side-panel-avatar-apply {
  background: #1877f2;
  color: #fff;
}

.side-panel-avatar-apply:hover {
  background: #166fe5;
}

.side-panel-avatar-cancel {
  background: #e4e6eb;
  color: #050505;
}

.side-panel-avatar-cancel:hover {
  background: #d8dadf;
}

.side-panel-items {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 2px;
}

.side-panel-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  color: #050505;
  transition: background 0.15s;
  text-align: left;
}
.side-panel-btn:hover { background: #f0f2f5; }
.side-panel-btn.danger { color: #e04040; }
.side-panel-btn.danger:hover { background: #fdecea; }
.sp-icon { width: 28px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sp-icon svg { width: 20px; height: 20px; }
.dialog-overlay {
  position:fixed;
  top:0;
  left:0;
  right:0;
  bottom:0;
  background:rgba(0,0,0,0.4);
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 12px;
  box-sizing: border-box;
  z-index:1000;
}

.dialog-box {
  background:white;
  border-radius:12px;
  width: min(560px, 100%);
  max-width: 100%;
  max-height: min(86vh, 720px);
  display:flex;
  flex-direction:column;
  overflow:hidden;
  box-sizing: border-box;
}

.dialog-header {
  padding:14px 18px;
  border-bottom:1px solid #e4e6eb;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap: 8px;
}

.dialog-header h3 {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-close-x {
  all: unset;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  font-size: 30px;
  color: #111827;
  cursor: pointer;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.modal-close-x:hover {
  color: #111827;
}

.modal-close-x:focus,
.modal-close-x:active {
  outline: none;
  background: transparent;
  box-shadow: none;
  color: #111827;
}

.nicknames-list { padding:6px 0; overflow-y:auto; }
.nickname-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; border-bottom:1px solid #eef0f3; }
.nickname-item:hover { background:#f5f6f8 }
.nickname-avatar { width:40px; height:40px; border-radius:50%; overflow:hidden; background:#e4e6eb; display:flex; align-items:center; justify-content:center; }
.nickname-avatar img { width:100%; height:100%; object-fit:cover; }
.default-avatar { font-size:18px; }
.nickname-info { flex:1; min-width:0; }
.nickname-username { font-weight:600; font-size:14px; }
.nickname-display { font-size:12px; color:#65676b; margin-top:2px; }
.nickname-inline-input {
  width: 100%;
  margin-top: 4px;
  padding: 8px 10px;
  border: 1px solid #ccd0d5;
  border-radius: 8px;
  font-size: 13px;
  box-sizing: border-box;
}
.nickname-inline-input:focus {
  outline: none;
  border-color: #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.12);
}
.edit-btn.save-inline { color:#166534; border-color:#bbf7d0; background:#f0fdf4; }
.edit-btn.save-inline:hover { background:#dcfce7; border-color:#86efac; }
.edit-btn.cancel-inline { color:#991b1b; border-color:#fecaca; background:#fef2f2; }
.edit-btn.cancel-inline:hover { background:#fee2e2; border-color:#fca5a5; }
.edit-btn { border:1px solid #e1e4e8; background:#f0f2f5; cursor:pointer; font-size:14px; width:32px; height:32px; padding:0; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; color:#3a3a3a; transition:background 0.2s, border-color 0.2s; }
.edit-btn:hover { background:#e9ebee; border-color:#d5d8dc; }
.nickname-edit { padding:12px; border-top:1px solid #e4e6eb; background:#f8f9fa; border-radius:10px; }
.nickname-edit input { width:100%; padding:9px 12px; border:1px solid #ccd0d5; border-radius:8px; margin-top:6px; box-sizing:border-box; }
.edit-buttons { display:flex; justify-content:flex-end; gap:8px; margin-top:10px; }
.btn-save { background:#1877f2; color:white; border:none; padding:8px 10px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; }
.btn-cancel { background:#e4e6eb; border:none; padding:8px 10px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; }

.modal-overlay {
  position:fixed;
  top:0;
  left:0;
  right:0;
  bottom:0;
  background:rgba(0,0,0,0.5);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:1000;
}

.modal-content {
  background:white;
  border-radius:12px;
  width:min(420px, 100%);
  max-width:100%;
  max-height:75vh;
  display:flex;
  flex-direction:column;
  box-sizing: border-box;
}

.modal-header {
  padding:16px 20px;
  border-bottom:1px solid #e4e6eb;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.modal-header h3 {
  margin:0;
  font-size:18px;
}



.members-list {
  padding:12px;
  overflow-y:auto;
  flex:1;
}

.member-item {
  display:flex;
  align-items:center;
  gap:12px;
  padding:10px;
  border-radius:8px;
  transition:background 0.15s;
}
.member-item:hover { background:#f0f2f5 }

.member-avatar {
  width:40px;
  height:40px;
  border-radius:50%;
  background:#e4e6eb;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:600;
  font-size:16px;
  overflow:hidden;
  flex-shrink:0;
}

.member-avatar img {
  width:100%;
  height:100%;
  object-fit:cover;
}

.member-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size:15px;
  font-weight:500;
}

.member-role-badge {
  width: fit-content;
  font-size: 12px;
  font-weight: 700;
  color: #1d4ed8;
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 2px 8px;
}

.member-role-badge.owner-badge {
  color: #92400e;
  background: #fef3c7;
  border-color: #fde68a;
}

.member-promote-btn {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.member-promote-btn:hover {
  background: #dbeafe;
}

.member-demote-btn {
  border: 1px solid #e9d5ff;
  background: #f5f3ff;
  color: #6d28d9;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.member-demote-btn:hover {
  background: #ede9fe;
}

.member-remove-btn {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.member-remove-btn:hover {
  background: #fee2e2;
}

@media (max-width: 900px) {
  .empty-chat { display: none; }
  .back-btn { display: inline-flex; }
  .side-panel { width: 100%; }
}

@media (max-width: 1024px) {
  .chat-header { height:64px; padding:0 12px; font-size:14px; }
}

@media (max-width: 768px) {
  .chat-header { height:58px; padding:0 10px; font-size:13px; }
}

@media (max-width: 480px) {
  .chat-header { height:52px; padding:0 8px; font-size:12px; }
}

/* ===== DARK MODE ===== */
html.dark-mode .chat-header {
  background: #000000;
  border-bottom-color: #1f2937;
  color: #e5e7eb;
}

html.dark-mode .back-btn { color: #e5e7eb; }
html.dark-mode .back-btn:hover { background: rgba(255, 255, 255, 0.08); }

html.dark-mode .group-avatar-btn { background: #111111; }
html.dark-mode .empty-chat { color: #9ca3af; }

html.dark-mode .header-dots-btn { color: #e5e7eb; }
html.dark-mode .header-dots-btn:hover { background: rgba(255, 255, 255, 0.08); }

/* Side panel */
html.dark-mode .side-panel {
  background: #0b0b0b;
  border-left-color: #1f2937;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.4);
}

html.dark-mode .side-panel-header {
  border-bottom-color: #1f2937;
}

html.dark-mode .side-panel-header h3 { color: #e5e7eb; }
html.dark-mode .side-panel-close { color: #e5e7eb; }
html.dark-mode .side-panel-close:hover { background: rgba(255, 255, 255, 0.08); }

html.dark-mode .side-panel-avatar-btn {
  background: #111111;
  color: #9ca3af;
}

html.dark-mode .side-panel-group-name { color: #e5e7eb; }

html.dark-mode .side-panel-avatar-apply { background: #2563eb; color: #fff; }
html.dark-mode .side-panel-avatar-apply:hover { background: #3b82f6; }
html.dark-mode .side-panel-avatar-cancel { background: #1a1a1a; color: #e5e7eb; }
html.dark-mode .side-panel-avatar-cancel:hover { background: #111111; }

html.dark-mode .side-panel-btn {
  color: #e5e7eb;
}

html.dark-mode .side-panel-btn:hover {
  background: #111111;
}

html.dark-mode .side-panel-btn.danger { color: #f87171; }
html.dark-mode .side-panel-btn.danger:hover { background: rgba(220, 38, 38, 0.12); }

/* Dialogs */
html.dark-mode .dialog-overlay { background: rgba(0, 0, 0, 0.7); }
html.dark-mode .dialog-box {
  background: #0b0b0b;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
}

html.dark-mode .dialog-header { border-bottom-color: #1f2937; }
html.dark-mode .dialog-header h3 { color: #e5e7eb; }
html.dark-mode .modal-close-x { color: #e5e7eb; }

html.dark-mode .nickname-item { border-bottom-color: #1f2937; }
html.dark-mode .nickname-item:hover { background: #111111; }
html.dark-mode .nickname-avatar { background: #111111; }
html.dark-mode .nickname-username { color: #e5e7eb; }
html.dark-mode .nickname-display { color: #9ca3af; }
html.dark-mode .nickname-inline-input { background: #0b0b0b; border-color: #1f2937; color: #e5e7eb; }
html.dark-mode .nickname-inline-input:focus { border-color: #60a5fa; box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.15); }
html.dark-mode .edit-btn.save-inline { background: rgba(22, 101, 52, 0.2); border-color: rgba(74, 222, 128, 0.35); color: #86efac; }
html.dark-mode .edit-btn.save-inline:hover { background: rgba(22, 101, 52, 0.3); }
html.dark-mode .edit-btn.cancel-inline { background: rgba(153, 27, 27, 0.2); border-color: rgba(248, 113, 113, 0.35); color: #fca5a5; }
html.dark-mode .edit-btn.cancel-inline:hover { background: rgba(153, 27, 27, 0.3); }
html.dark-mode .edit-btn { background: #111111; border-color: #1f2937; color: #d1d5db; }
html.dark-mode .edit-btn:hover { background: #1a1a1a; border-color: #374151; }
html.dark-mode .nickname-edit { background: #111111; border-top-color: #1f2937; }
html.dark-mode .nickname-edit input { background: #0b0b0b; border-color: #1f2937; color: #e5e7eb; }
html.dark-mode .btn-save { background: #2563eb; color: white; }
html.dark-mode .btn-cancel { background: #1a1a1a; color: #e5e7eb; }

/* Members modal */
html.dark-mode .modal-overlay { background: rgba(0, 0, 0, 0.7); }
html.dark-mode .modal-content { background: #0b0b0b; }
html.dark-mode .modal-header { border-bottom-color: #1f2937; }
html.dark-mode .modal-header h3 { color: #e5e7eb; }
html.dark-mode .modal-close-x:hover { color: #e5e7eb; }
html.dark-mode .modal-close-x:focus,
html.dark-mode .modal-close-x:active { color: #e5e7eb; }
html.dark-mode .member-item:hover { background: #111111; }
html.dark-mode .member-avatar { background: #111111; color: #9ca3af; }
html.dark-mode .member-name { color: #e5e7eb; }
html.dark-mode .member-role-badge { color: #93c5fd; background: rgba(37, 99, 235, 0.2); border-color: rgba(96, 165, 250, 0.35); }
html.dark-mode .member-role-badge.owner-badge { color: #fcd34d; background: rgba(180, 83, 9, 0.2); border-color: rgba(251, 191, 36, 0.35); }
html.dark-mode .member-promote-btn { background: rgba(37, 99, 235, 0.18); border-color: rgba(96, 165, 250, 0.35); color: #93c5fd; }
html.dark-mode .member-promote-btn:hover { background: rgba(37, 99, 235, 0.28); }
html.dark-mode .member-demote-btn { background: rgba(109, 40, 217, 0.18); border-color: rgba(167, 139, 250, 0.35); color: #c4b5fd; }
html.dark-mode .member-demote-btn:hover { background: rgba(109, 40, 217, 0.28); }
html.dark-mode .member-remove-btn { background: rgba(185, 28, 28, 0.15); border-color: rgba(239, 68, 68, 0.35); color: #fca5a5; }
html.dark-mode .member-remove-btn:hover { background: rgba(185, 28, 28, 0.22); }
  .member-meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
