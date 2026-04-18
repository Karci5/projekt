@media (max-width: 600px) {
  .chat-header {
    height: 72px;
    padding: 0 10px;
    font-size: 15px;
  }
  .back-btn {
    display: inline-flex;
    width: 38px;
    height: 38px;
  }
  .back-icon {
    width: 28px;
    height: 28px;
  }
  .header-dots-btn {
    width: 38px;
    height: 38px;
    font-size: 28px;
  }
  .chat-header span {
    font-size: 22px !important;
    font-weight: 700 !important;
    flex: 1 1 0%;
    text-align: center;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0 8px;
  }
}
<template>
  <div class="chat">
    <div v-if="!activeFriend" class="empty-chat">Vyber chat</div>
    <div v-else class="chat-window">
      <div class="chat-header">
        <button class="back-btn" @click="$emit('close-chat')" aria-label="Späť">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <span>
          {{ nicknames && nicknames[activeFriend.id] ? nicknames[activeFriend.id] : activeFriend.username }}
        </span>
        <div class="header-menu">
          <button class="header-dots-btn" @click.stop="toggleHeaderMenu" aria-label="Menu">⋮</button>
        </div>
      </div>

      <!-- Side panel backdrop -->
      <transition name="fade">
        <div v-if="headerMenuOpen" class="panel-backdrop" @click="headerMenuOpen = false"></div>
      </transition>

      <!-- Side panel -->
      <transition name="panel-slide">
        <div v-if="headerMenuOpen" class="side-panel" @click.stop>
          <div class="side-panel-header">
            <h3>Nastavenia chatu</h3>
            <span class="side-panel-close" role="button" tabindex="-1" @click="headerMenuOpen = false">✕</span>
          </div>
          <div class="side-panel-avatar">
            <div class="side-panel-avatar-display">
              <img v-if="activeFriend.profile_picture" :src="activeFriend.profile_picture" alt="" />
              <span v-else class="avatar-placeholder">{{ activeFriend.username ? activeFriend.username[0].toUpperCase() : '?' }}</span>
            </div>
            <div class="side-panel-friend-name">{{ nicknames && nicknames[activeFriend.id] ? nicknames[activeFriend.id] : activeFriend.username }}</div>
          </div>
          <div class="side-panel-items">
            <button class="side-panel-btn" @click.stop="openThemes">
              <span class="sp-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg></span>
              <span>Motívy</span>
            </button>
            <button class="side-panel-btn" @click.stop="openNicknamesDialog">
              <span class="sp-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span>
              <span>Prezývky</span>
            </button>
            <button class="side-panel-btn" @click.stop="toggleMuteFromPanel">
              <span class="sp-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M22 9l-6 6"/><path d="M16 9l6 6"/></svg></span>
              <span>{{ isMuted ? 'Zrušiť stíšenie' : 'Stíšiť chat' }}</span>
            </button>
            <button class="side-panel-btn side-panel-btn-block" @click.stop="toggleBlockFromPanel">
              <span class="sp-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></svg></span>
              <span>{{ haveIBlockedCurrentFriend ? 'Odblokovať' : 'Zablokovať' }}</span>
            </button>
          </div>
        </div>
      </transition>

      <MessagesList
        ref="messagesList"
        :messages="messages"
        @edit="startEdit"
        @delete="$emit('delete', $event)"
        @reply="startReply"
      />

      <!-- Blocked status messages -->
      <div v-if="amIBlockedByCurrentFriend" class="blocked-status-banner">
        <div class="blocked-icon">🚫</div>
        <div class="blocked-content">
          <div class="blocked-title">Používateľ ťa zablokoval</div>
          <div class="blocked-desc">Nemôžeš mu/jej posielať správy</div>
        </div>
      </div>

      <div v-else-if="haveIBlockedCurrentFriend" class="blocked-status-banner you-blocked">
        <div class="blocked-icon">🔒</div>
        <div class="blocked-content">
          <div class="blocked-title">Používateľ je blokovaný</div>
          <div class="blocked-desc">Správy nebudú doručené</div>
        </div>
        <button @click="unblockCurrentFriend" class="unblock-btn">Odblokovať</button>
      </div>

      <!-- Message input - only show if not blocked -->
      <MessageInput
        v-if="!amIBlockedByCurrentFriend && !haveIBlockedCurrentFriend"
        :value="inputValue"
        :is-editing="!!editingMessage"
        :reply-to="replyToMessage"
        @send="handleSend"
        @cancel-edit="cancelEdit"
        @cancel-reply="cancelReply"
      />

      <!-- Nicknames Dialog -->
      <div v-if="showNicknamesDialog" class="dialog-overlay" @click="showNicknamesDialog = false">
        <div class="dialog-box nicknames-dialog" @click.stop>
          <div class="dialog-header">
            <h3>Prezývky</h3>
            <button @click="showNicknamesDialog = false" class="modal-close-x" aria-label="Zavrieť">✕</button>
          </div>
          <div class="nicknames-list">
            <div v-for="friend in allFriends" :key="friend.id" class="nickname-item">
              <div class="nickname-avatar">
                <img v-if="friend.profile_picture" :src="friend.profile_picture" :alt="friend.username" />
                <div v-else class="default-avatar">👤</div>
              </div>
              <div class="nickname-info">
                <div class="nickname-username">{{ friend.username }}</div>
                <template v-if="editingNicknameFor && editingNicknameFor.id === friend.id">
                  <input
                    :ref="`nicknameInput-${friend.id}`"
                    v-model="nicknameEditInput"
                    class="nickname-inline-input"
                    type="text"
                    placeholder="Zadaj prezývku"
                    @keyup.enter="saveNicknameEdit"
                    @keyup.esc="cancelNicknameEdit"
                  />
                </template>
                <div v-else class="nickname-display">{{ getNicknameFor(friend.id) || 'Bez prezývky' }}</div>
              </div>
              <template v-if="editingNicknameFor && editingNicknameFor.id === friend.id">
                <button @click="saveNicknameEdit" class="edit-btn save-inline" aria-label="Uložiť">✓</button>
                <button @click="cancelNicknameEdit" class="edit-btn cancel-inline" aria-label="Zrušiť">✕</button>
              </template>
              <button v-else @click="editNickname(friend)" class="edit-btn" aria-label="Upraviť prezývku">✎</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Member Info Dialog -->
      <div v-if="showMemberInfo" class="dialog-overlay" @click="showMemberInfo = false">
        <div class="dialog-box" @click.stop>
          <div class="dialog-header">
            <h3>Informácie o člene</h3>
            <button @click="showMemberInfo = false" class="modal-close-x" aria-label="Zavrieť">✕</button>
          </div>
          <div class="member-info">
            <p><strong>Používateľ:</strong> {{ activeFriend.username }}</p>
            <p><strong>ID:</strong> {{ activeFriend.id }}</p>
            <p v-if="activeFriend.profile_picture"><strong>Profil:</strong> <img :src="activeFriend.profile_picture" class="member-avatar" /></p>
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
    activeFriend: Object,
    messages: Array,
    friends: Array,
    nicknames: Object,
    currentUserName: String,
    isMuted: { type: Boolean, default: false },
    amIBlockedByCurrentFriend: { type: Boolean, default: false },
    haveIBlockedCurrentFriend: { type: Boolean, default: false },
    userId: { type: [String, Number], default: null }
  },
  emits: ['send', 'edit', 'delete', 'reply', 'open-themes', 'update-nickname', 'close-chat', 'toggle-block', 'toggle-mute'],
  components: { MessagesList, MessageInput },
  data() {
    return {
      editingMessage: null,
      inputValue: '',
      headerMenuOpen: false,
      replyToMessage: null,
      showNicknamesDialog: false,
      showMemberInfo: false,
      editingNicknameFor: null,
      nicknameEditInput: ''
    }
  },
  computed: {
    allFriends() {
      if (!this.activeFriend) return [];
      return [this.activeFriend];
    }
  },
  methods: {
    toggleMuteFromPanel() {
      if (!this.activeFriend) return;
      this.$emit('toggle-mute', this.activeFriend);
      this.headerMenuOpen = false;
    },
    toggleBlockFromPanel() {
      if (!this.activeFriend) return;
      this.$emit('toggle-block', this.activeFriend);
      this.headerMenuOpen = false;
    },
    unblockCurrentFriend() {
      if (this.activeFriend) {
        this.$emit('toggle-block', this.activeFriend);
      }
    },
    startEdit(msg) {
      this.editingMessage = msg;
      this.inputValue = msg.message || '';
    },
    startReply(msg) {
  
      const enrichedMsg = {
        ...msg,
        username: msg.username || (msg.mine ? (this.currentUserName || 'Ty') : (this.activeFriend && this.activeFriend.username)) || 'Neznámy'
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
        this.$emit('send', { text: payload, editTarget: this.editingMessage });
        this.cancelEdit();
        return;
      }

      // attachments or normal send
      this.$emit('send', payload);
      this.inputValue = '';
      this.replyToMessage = null;
      this.$nextTick(() => {
        const list = this.$refs.messagesList;
        if (list && typeof list.jumpToLatest === 'function') list.jumpToLatest();
      });
    },
    toggleHeaderMenu() {
      this.headerMenuOpen = !this.headerMenuOpen;
    },
    openThemes() {
      this.headerMenuOpen = false;
      this.$emit('open-themes');
    },
    openMemberInfo() {
      this.showMemberInfo = true;
      this.headerMenuOpen = false;
    },
    openNicknamesDialog() {
      this.showNicknamesDialog = true;
      this.headerMenuOpen = false;
      this.editingNicknameFor = null;
    },
    editNickname(friend) {
      this.editingNicknameFor = friend;
      this.nicknameEditInput = this.getNicknameFor(friend.id) || '';
      this.$nextTick(() => {
        const ref = this.$refs[`nicknameInput-${friend.id}`];
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
        // Emit event to parent to update nicknames
        this.$emit('update-nickname', {
          friendId: this.editingNicknameFor.id,
          nickname: this.nicknameEditInput
        });
        this.editingNicknameFor = null;
        this.nicknameEditInput = '';
      }
    },
    getNicknameFor(friendId) {
      return (this.nicknames && this.nicknames[friendId]) || '';
    }
  }
}
</script>

<style scoped>
.chat { flex:1; display:flex; flex-direction:column; min-height:0 }
.chat-window { flex:1; display:flex; flex-direction:column; min-height:0; position: relative; overflow: hidden; }
.chat-header { height:80px; padding:0 15px; box-sizing:border-box; background:white; border-bottom:1px solid #ddd; font-weight:bold; font-size:20px; display:flex; align-items:center; justify-content:space-between }
.empty-chat { margin:auto; color:#777 }

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
  appearance: none;
  -webkit-tap-highlight-color: transparent;
  color: #111827;
  align-items: center;
  justify-content: center;
}
.back-btn:hover { background: rgba(0,0,0,0.06); }
.back-icon { width: 18px; height: 18px; }

.header-menu { position:relative }
.header-dots-btn {
  color:#333;
  width:32px;
  height:32px;
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
.header-dots-btn:focus-visible {
  outline: none;
  box-shadow: none;
}
.message-actions button,
.message-menu button {
  color: #000; 
}

/* Side panel backdrop */
.panel-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 89;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Side panel */
.side-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
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

@media (max-width: 1200px) {
  .side-panel { width: 100%; border-left: none; }
}


@media (max-width: 900px) {
  .empty-chat { display: none; }
  .back-btn { display: inline-flex; }
  .dialog-box { width: 100%; min-width: 0; }
  .nicknames-dialog { min-width: 0; width: 100%; max-height: 85vh; }
  .modal-content { width: 95%; }
  .chat-header {
    height: 56px;
    font-size: 16px;
    padding: 0 8px;
  }
  .chat-window {
    padding: 0 2px;
  }
  .side-panel-header {
    padding: 10px 8px;
    font-size: 15px;
  }
  .side-panel-avatar-display {
    width: 64px;
    height: 64px;
    font-size: 22px;
  }
  .side-panel-friend-name {
    font-size: 15px;
  }
  .side-panel-items {
    gap: 0;
    padding: 4px;
  }
  .side-panel-btn {
    font-size: 13px;
    padding: 10px 8px;
    gap: 8px;
  }
  .sp-icon {
    width: 22px;
  }
  .sp-icon svg {
    width: 16px;
    height: 16px;
  }
}

@media (max-width: 600px) {
  .chat-header {
    height: 44px;
    font-size: 14px;
    padding: 0 4px;
  }
  .chat-window {
    padding: 0 1px;
  }
  .side-panel-header {
    padding: 8px 4px;
    font-size: 13px;
  }
  .side-panel-avatar-display {
    width: 44px;
    height: 44px;
    font-size: 15px;
  }
  .side-panel-friend-name {
    font-size: 12px;
  }
  .side-panel-items {
    gap: 0;
    padding: 2px;
  }
  .side-panel-btn {
    font-size: 11px;
    padding: 7px 4px;
    gap: 5px;
  }
  .sp-icon {
    width: 16px;
  }
  .sp-icon svg {
    width: 12px;
    height: 12px;
  }
  .message-bubble, .reply-bubble {
    font-size: 13px !important;
    white-space: pre;
    padding: 7px 8px !important;
    max-width: 90vw !important;
    display: inline-block;
  }
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
.side-panel-avatar-display {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #e4e6eb;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  color: #65676b;
}
.side-panel-avatar-display img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.avatar-placeholder { pointer-events: none; }
.side-panel-friend-name {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  word-break: break-word;
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
.side-panel-btn-block {
  color: #b91c1c;
}
.side-panel-btn-block:hover {
  background: #fef2f2;
}
.sp-icon { width: 28px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sp-icon svg { width: 20px; height: 20px; }

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  box-sizing: border-box;
  z-index: 1001;
}

.dialog-box {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: min(560px, 100%);
  min-width: 0;
  max-width: 100%;
  max-height: min(88vh, 720px);
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.dialog-box h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #1a1a1a;
  font-size: 18px;
}

.dialog-box input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.dialog-box input:focus {
  outline: none;
  border-color: #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.1);
}

.dialog-buttons {
  display: flex;
  gap: 10px;
}

.btn-save,
.btn-cancel,
.btn-close {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-save {
  background: #1877f2;
  color: white;
}

.btn-save:hover {
  background: #0a66c2;
}

.btn-cancel,
.btn-close {
  background: #f0f2f5;
  color: #1a1a1a;
}

.btn-cancel:hover,
.btn-close:hover {
  background: #e4e6eb;
}

.member-info {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.member-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #333;
}

.member-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-left: 8px;
  vertical-align: middle;
}

/* Nicknames Dialog */
.nicknames-dialog {
  width: min(620px, 100%);
  min-width: 0;
  max-height: min(85vh, 600px);
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h3 {
  margin: 0;
  color: #1a1a1a;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.nicknames-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 10px;
  padding: 6px 0;
}

.nickname-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #eef0f3;
  transition: background 0.2s;
}

.nickname-item:hover {
  background: #f5f6f8;
}

.nickname-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nickname-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  font-size: 18px;
}

.nickname-info {
  flex: 1;
  min-width: 0;
}

.nickname-username {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 14px;
}

.nickname-display {
  font-size: 12px;
  color: #65676b;
  margin-top: 2px;
}

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

.edit-btn.save-inline {
  color: #166534;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.edit-btn.save-inline:hover {
  background: #dcfce7;
  border-color: #86efac;
}

.edit-btn.cancel-inline {
  color: #991b1b;
  border-color: #fecaca;
  background: #fef2f2;
}

.edit-btn.cancel-inline:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.edit-btn {
  background: #f0f2f5;
  border: 1px solid #e1e4e8;
  color: #3a3a3a;
  cursor: pointer;
  font-size: 14px;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s;
}

.edit-btn:hover {
  background: #e9ebee;
  border-color: #d5d8dc;
}

.nickname-edit {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  border-top: 1px solid #e0e0e0;
}

.nickname-edit p {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #1a1a1a;
}

.nickname-edit input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.nickname-edit input:focus {
  outline: none;
  border-color: #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.1);
}

.edit-buttons {
  display: flex;
  gap: 8px;
}

.edit-buttons .btn-save,
.edit-buttons .btn-cancel {
  flex: 1;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.edit-buttons .btn-save {
  background: #1877f2;
  color: white;
}

.edit-buttons .btn-save:hover {
  background: #0a66c2;
}

.edit-buttons .btn-cancel {
  background: white;
  color: #1877f2;
  border: 1px solid #1877f2;
}

.edit-buttons .btn-cancel:hover {
  background: #f0f2f5;
}

@media (max-width: 1024px) {
  .chat-header { height:64px; padding:0 12px; font-size:14px }
}

@media (max-width: 768px) {
  .chat-header { height:58px; padding:0 10px; font-size:13px }
  .empty-chat { font-size:13px }
}

@media (max-width: 480px) {
  .chat-header { height:52px; padding:0 8px; font-size:12px }
  .empty-chat { font-size:12px }
}

/* ===== DARK MODE ===== */
html.dark-mode .chat-header {
  background: #000000;
  border-bottom-color: #1f2937;
  color: #e5e7eb;
}

html.dark-mode .back-btn {
  color: #e5e7eb;
}

html.dark-mode .back-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

html.dark-mode .empty-chat {
  color: #9ca3af;
}

html.dark-mode .header-dots-btn {
  color: #e5e7eb;
}

html.dark-mode .header-dots-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Side panel dark */
html.dark-mode .panel-backdrop {
  background: rgba(0,0,0,0.55);
}

html.dark-mode .side-panel {
  background: #0b0b0b;
  border-left-color: #1f2937;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.4);
}

html.dark-mode .side-panel-header {
  border-bottom-color: #1f2937;
}

html.dark-mode .side-panel-header h3 {
  color: #e5e7eb;
}

html.dark-mode .side-panel-close {
  color: #e5e7eb;
}

html.dark-mode .side-panel-close:hover {
  background: rgba(255, 255, 255, 0.08);
}

html.dark-mode .side-panel-avatar-display {
  background: #111111;
  color: #9ca3af;
}

html.dark-mode .side-panel-friend-name {
  color: #e5e7eb;
}

html.dark-mode .side-panel-btn {
  color: #e5e7eb;
}

html.dark-mode .side-panel-btn:hover {
  background: #111111;
}

html.dark-mode .dialog-overlay {
  background: rgba(0, 0, 0, 0.7);
}

html.dark-mode .dialog-box {
  background: #0b0b0b;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
}

html.dark-mode .dialog-box h3 {
  color: #e5e7eb;
}

html.dark-mode .dialog-box input {
  background: #111111;
  border-color: #1f2937;
  color: #e5e7eb;
}

html.dark-mode .dialog-box input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.15);
}

html.dark-mode .btn-save {
  background: #2563eb;
}

html.dark-mode .btn-save:hover {
  background: #3b82f6;
}

html.dark-mode .btn-cancel,
html.dark-mode .btn-close {
  background: #111111;
  color: #e5e7eb;
}

html.dark-mode .btn-cancel:hover,
html.dark-mode .btn-close:hover {
  background: #1a1a1a;
}

html.dark-mode .member-info {
  background: #111111;
}

html.dark-mode .member-info p {
  color: #d1d5db;
}

/* Nicknames Dialog Dark */
html.dark-mode .nicknames-dialog {
  background: #0b0b0b;
}

html.dark-mode .dialog-header {
  border-bottom-color: #1f2937;
}

html.dark-mode .dialog-header h3 {
  color: #e5e7eb;
}

html.dark-mode .modal-close-x {
  color: #e5e7eb;
}

html.dark-mode .modal-close-x:hover {
  color: #e5e7eb;
}

html.dark-mode .nickname-item {
  border-bottom-color: #1f2937;
}

html.dark-mode .nickname-item:hover {
  background: #111111;
}

html.dark-mode .nickname-avatar {
  background: #111111;
}

html.dark-mode .nickname-username {
  color: #e5e7eb;
}

html.dark-mode .nickname-display {
  color: #9ca3af;
}

html.dark-mode .nickname-inline-input {
  background: #0b0b0b;
  border-color: #1f2937;
  color: #e5e7eb;
}

html.dark-mode .nickname-inline-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.15);
}

html.dark-mode .edit-btn.save-inline {
  background: rgba(22, 101, 52, 0.2);
  border-color: rgba(74, 222, 128, 0.35);
  color: #86efac;
}

html.dark-mode .edit-btn.save-inline:hover {
  background: rgba(22, 101, 52, 0.3);
}

html.dark-mode .edit-btn.cancel-inline {
  background: rgba(153, 27, 27, 0.2);
  border-color: rgba(248, 113, 113, 0.35);
  color: #fca5a5;
}

html.dark-mode .edit-btn.cancel-inline:hover {
  background: rgba(153, 27, 27, 0.3);
}

html.dark-mode .edit-btn {
  background: #111111;
  border-color: #1f2937;
  color: #d1d5db;
}

html.dark-mode .edit-btn:hover {
  background: #1a1a1a;
  border-color: #374151;
}

html.dark-mode .nickname-edit {
  background: #111111;
  border-top-color: #1f2937;
}

html.dark-mode .nickname-edit p {
  color: #e5e7eb;
}

html.dark-mode .nickname-edit input {
  background: #0b0b0b;
  border-color: #1f2937;
  color: #e5e7eb;
}

html.dark-mode .edit-buttons .btn-cancel {
  background: #0b0b0b;
  color: #60a5fa;
  border-color: #60a5fa;
}

html.dark-mode .edit-buttons .btn-cancel:hover {
  background: #111111;
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

/* Blocked status messages */
.blocked-status-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-top: 1px solid #fca5a5;
  border-bottom: 2px solid #f87171;
  flex-shrink: 0;
}

.blocked-status-banner.you-blocked {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-top-color: #93c5fd;
  border-bottom-color: #3b82f6;
}

.blocked-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.blocked-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.blocked-title {
  font-size: 15px;
  font-weight: 600;
  color: #7f1d1d;
}

.blocked-status-banner.you-blocked .blocked-title {
  color: #1e40af;
}

.blocked-desc {
  font-size: 13px;
  color: #991b1b;
}

.blocked-status-banner.you-blocked .blocked-desc {
  color: #1e3a8a;
}

.unblock-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.unblock-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.unblock-btn:active {
  transform: translateY(0);
}
</style>
