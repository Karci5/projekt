<template>
  <div class="chat-layout">
    <Sidebar
      v-if="!isMobileView || (!activeFriend && !activeGroup)"
      :friends="friends"
      :all-users="allUsers"
      :current-user-id="userId"
      :requests="requests"
      :sent-requests="sentRequests"
      :search-user="searchUser"
      :active-tab="activeTab"
      :current-user-name="currentUsername"
      :user-avatar="selfAvatar"
      :self-online="selfOnline"
      :show-presence="showPresence"
      :groups="groups"
      :nicknames="nicknames"
      :friend-notes="friendNotes"
      :pinned-friend-ids="pinnedFriendIds"
      :muted-friend-ids="mutedFriendIds"
      :blocked-friend-ids="blockedFriendIds"
      :friend-presence="friendPresence"
      :friends-filter="friendsFilter"
      :friends-sort="friendsSort"
      :hide-tabs="showSettings"
      @change-tab="val => activeTab = val"
      @select-friend="selectFriend"
      @select-group="selectGroup"
      @create-group="() => { showCreateGroup = true }"
      @send-request="sendRequest"
      @cancel-sent-request="cancelSentRequest"
      @accept-request="acceptRequest"
      @decline-request="declineRequest"
      @remove-friend="removeFriend"
      @toggle-pin-friend="togglePinFriend"
      @toggle-mute-friend="toggleMuteFriend"
      @toggle-block-friend="toggleBlockFriend"
      @view-friend-profile="openFriendProfile"
      @edit-friend-note="editFriendNote"
      @set-friends-filter="setFriendsFilter"
      @set-friends-sort="setFriendsSort"
      @update-search="val => searchUser = val"
      @open-settings="openSettings"
      @logout="logout"
      @write-message="openChatWithFriend"
    ></Sidebar>

    <ChatWindow
      v-if="!activeGroup && (!isMobileView || !!activeFriend)"
      :activeFriend="activeFriend"
      :messages="messages"
      :friends="friends"
      :nicknames="nicknames"
      :is-muted="activeFriend ? mutedFriendIds.map(String).includes(String(activeFriend.id)) : false"
      :reply-to-message="replyToMessage"
      :class="'theme-' + currentTheme"
      :amIBlockedByCurrentFriend="amIBlockedByCurrentFriend"
      :haveIBlockedCurrentFriend="haveIBlockedCurrentFriend"
      :userId="userId"
      @send="sendMessage"
      @edit="editMessage"
      @delete="deleteMessage"
      @reply="replyToMessage = $event"
      @open-themes="showThemes = true"
      @update-nickname="(e) => updateNickname(e.friendId, e.nickname)"
      @toggle-block="toggleBlockFriend"
      @toggle-mute="toggleMuteFriend"
      @close-chat="handleCloseChat"
    ></ChatWindow>

    <GroupChat
      v-else-if="!isMobileView || !!activeGroup"
      :activeGroup="activeGroup"
      :messages="groupMessages"
      :members="groupMembers"
      :current-user-id="userId"
      :can-edit-theme="groupCanEditTheme"
      :is-muted="isGroupMuted(activeGroup)"
      :reply-to-message="replyToGroupMessage"
      @send="sendGroupMessage"
      @edit="editGroupMessage"
      @delete="deleteGroupMessage"
      @reply="replyToGroupMessage = $event"
      @open-themes="openGroupThemes"
      @toggle-mute-group="toggleMuteGroup"
      @update-group-avatar="updateGroupAvatar"
      @leave-group="leaveActiveGroup"
      @remove-member="removeGroupMember"
      @promote-member="promoteGroupMember"
      @demote-member="demoteGroupMember"
      @close-chat="handleCloseChat"
    ></GroupChat>

    <Settings
      v-if="showSettings"
      :userId="userId"
      @close="showSettings = false"
      @profile-updated="refreshProfile"
      @dark-mode-changed="setDarkMode"
      @privacy-changed="applyPrivacySettings"
      @blocked-list-changed="applyBlockedList"
    />

    <Themes
      v-if="showThemes"
      :selected-theme="currentTheme"
      @close="showThemes = false"
      @theme-changed="applyTheme"
    />


  <!-- ...ostatné komponenty a layout... -->

  <!-- CreateGroup modál je vždy na konci DOM, nezávislý od Sidebaru -->
  <CreateGroup
    v-if="showCreateGroup"
    :friends="friends"
    @close="showCreateGroup = false"
    @create="createGroup"
  />

    <ConfirmDialog
      v-if="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirmText="confirmDialog.confirmText"
      :cancelText="confirmDialog.cancelText"
      @confirm="confirmDialog.onConfirm"
      @cancel="closeConfirmDialog"
    />

    <div v-if="friendProfile.show && friendProfile.user" class="profile-overlay" @click="friendProfile.show = false">
      <div class="profile-dialog" @click.stop>
        <button class="profile-close" @click="friendProfile.show = false">✕</button>
        <div class="profile-avatar">
          <img v-if="friendProfile.user.profile_picture" :src="friendProfile.user.profile_picture" alt="" />
          <span v-else>{{ String(friendProfile.user.username || '?').slice(0, 2).toUpperCase() }}</span>
        </div>
        <h3>{{ friendProfile.user.username }}</h3>
        <p>ID: {{ friendProfile.user.id }}</p>
        <p v-if="friendNotes[String(friendProfile.user.id)]">Poznámka: {{ friendNotes[String(friendProfile.user.id)] }}</p>
      </div>
    </div>

    <div v-if="undoToast.show" class="undo-toast">
      <span>{{ undoToast.message }}</span>
      <button @click="undoRemoveFriend">Vrátiť späť</button>
    </div>
  </div>
</template>

<script>
import { createSocket } from "../composables/useSocket";
import Sidebar from "../components/Sidebar.vue";
import ChatWindow from "../components/ChatWindow.vue";
import GroupChat from "../components/GroupChat.vue";
import CreateGroup from "../components/CreateGroup.vue";
import Settings from "../components/Settings.vue";
import Themes from "../components/Themes.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { apiUrl as buildApiUrl, toAbsoluteUploadUrl } from "../utils/backendUrl";

export default {
  components: { Sidebar, ChatWindow, GroupChat, CreateGroup, Settings, Themes, ConfirmDialog },
  data() {
    return {
      socket: null,
      userId: localStorage.getItem("userId"),
      selfAvatar: toAbsoluteUploadUrl(localStorage.getItem('profile_picture')) || null,
      activeTab: "chats",
      friends: [],
      allUsers: [],
      requests: [],
      sentRequests: [],
      activeFriend: null,
      messages: [],
      replyToMessage: null,
      replyToGroupMessage: null,
      newMessage: "",
      searchUser: "",
      showSettings: false,
      showThemes: false,
      showCreateGroup: false,
      groups: [],
      activeGroup: null,
      groupThemePermission: 'admin_only',
      groupCanEditTheme: false,
      groupMessages: [],
      groupPollTimer: null,
      requestPollTimer: null,
      groupMembers: [],
      darkMode: localStorage.getItem('uiDarkMode') === 'true',
      selfOnline: false,
      showPresence: localStorage.getItem('privacy_show_online') !== 'false',
      lastNotificationAt: 0,
      currentTheme: 'default',
      themeColors: this.getThemeColors('default'),
      nicknames: {},
      friendNotes: {},
      pinnedFriendIds: [],
      mutedFriendIds: [],
      mutedGroupIds: [],
      blockedFriendIds: [],
      amIBlockedByCurrentFriend: false,
      isMobileView: typeof window !== 'undefined' ? window.innerWidth <= 900 : false,
      friendPresence: {},
      friendsFilter: 'all',
      friendsSort: 'pinned',
      friendProfile: {
        show: false,
        user: null
      },
      undoToast: {
        show: false,
        message: '',
        friendId: null,
        timerId: null
      },
      confirmDialog: {
        show: false,
        title: '',
        message: '',
        confirmText: 'Áno',
        cancelText: 'Zrušiť',
        onConfirm: null
      }
    };
  },

  computed: {
    filteredUsers() {
      const search = this.searchUser.toLowerCase();
      return this.allUsers.filter(user =>
        user.username.toLowerCase().includes(search)
      );
    },
    currentUsername() {
      return localStorage.getItem('username') || 'Ty';
    },
    haveIBlockedCurrentFriend() {
      if (!this.activeFriend) return false;
      return this.blockedFriendIds.includes(String(this.activeFriend.id));
    }
  },

  mounted() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    this.applyUiDarkMode(this.darkMode);
    this.loadNicknames();
    this.loadFriendPrefs();
    this.initSocket();
    this.loadFriends();
    this.loadAllUsers();
    this.loadRequests();
    this.loadSentRequests();
    this.startRequestPolling();
    this.loadGroups();
    this.loadFriendPresence();
    this.refreshProfile();
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    this.stopGroupPolling();
    this.stopRequestPolling();
    if (this.socketApi) this.socketApi.disconnect();
  },

  methods: {
    openChatWithFriend(friend) {
      this.activeFriend = friend;
      this.activeGroup = null;
    },
    applyPrivacySettings(settings) {
      if (!settings) return;
      this.showPresence = settings.showOnline !== false;
    },
    applyBlockedList(ids) {
      if (!Array.isArray(ids)) return;
      this.blockedFriendIds = ids.map(v => String(v));
      this.saveFriendPrefs();
      if (this.activeFriend) {
        const activeId = String(this.activeFriend.id);
        if (!this.blockedFriendIds.includes(activeId) && this.haveIBlockedCurrentFriend) {
          // computed value updates automatically from blockedFriendIds
        }
      }
    },
    handleResize() {
      this.isMobileView = window.innerWidth <= 900;
    },
    handleCloseChat() {
      this.activeFriend = null;
      this.activeGroup = null;
      this.replyToMessage = null;
      this.replyToGroupMessage = null;
      this.stopGroupPolling();
    },
    startRequestPolling() {
      this.stopRequestPolling();
      // Fallback refresh in case real-time event is missed.
      this.requestPollTimer = setInterval(() => {
        this.loadRequests();
        this.loadSentRequests();
      }, 5000);
    },
    stopRequestPolling() {
      if (this.requestPollTimer) {
        clearInterval(this.requestPollTimer);
        this.requestPollTimer = null;
      }
    },
    setDarkMode(val) {
      this.darkMode = !!val;
      this.applyUiDarkMode(this.darkMode);
    },
    applyUiDarkMode(val) {
      const root = document.documentElement;
      if (!root) return;
      root.classList.toggle('dark-mode', !!val);
    },
    getNotificationSettings() {
      const soundEnabled = localStorage.getItem('notifications_sound') !== 'false';
      const dndEnabled = localStorage.getItem('notifications_dnd_enabled') === 'true';
      const dndFrom = localStorage.getItem('notifications_dnd_from') || '22:00';
      const dndTo = localStorage.getItem('notifications_dnd_to') || '07:00';
      return { soundEnabled, dndEnabled, dndFrom, dndTo };
    },
    parseHm(text) {
      const m = String(text || '').match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return null;
      const h = Number(m[1]);
      const min = Number(m[2]);
      if (h < 0 || h > 23 || min < 0 || min > 59) return null;
      return h * 60 + min;
    },
    isNowInDnd(dndFrom, dndTo) {
      const from = this.parseHm(dndFrom);
      const to = this.parseHm(dndTo);
      if (from === null || to === null) return false;
      const now = new Date();
      const current = now.getHours() * 60 + now.getMinutes();
      if (from === to) return true;
      if (from < to) return current >= from && current < to;
      return current >= from || current < to;
    },
    shouldPlayNotificationSound() {
      const { soundEnabled, dndEnabled, dndFrom, dndTo } = this.getNotificationSettings();
      if (!soundEnabled) return false;
      if (dndEnabled && this.isNowInDnd(dndFrom, dndTo)) return false;
      const now = Date.now();
      if (now - this.lastNotificationAt < 250) return false;
      this.lastNotificationAt = now;
      return true;
    },
    playNotificationSound() {
      if (!this.shouldPlayNotificationSound()) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const master = ctx.createGain();
        master.gain.value = 0.8;
        master.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.value = 784; // G5
        gain1.gain.value = 0.0001;
        osc1.connect(gain1);
        gain1.connect(master);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 988; // B5
        gain2.gain.value = 0.0001;
        osc2.connect(gain2);
        gain2.connect(master);

        const now = ctx.currentTime;
        // Different sound profile: short, airy two-tone chime.
        gain1.gain.exponentialRampToValueAtTime(0.012, now + 0.018);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

        gain2.gain.exponentialRampToValueAtTime(0.009, now + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);

        osc1.start(now);
        osc2.start(now + 0.02);
        osc1.stop(now + 0.17);
        osc2.stop(now + 0.2);

        osc2.onended = () => {
          if (ctx && typeof ctx.close === 'function') ctx.close();
        };
      } catch (e) {
        // ignore if browser blocks autoplay/audio context
      }
    },
    normalizeMediaUrl(value) {
      return toAbsoluteUploadUrl(value);
    },
    normalizeAttachmentUrl(attachment) {
      if (!attachment) return attachment;

      const toAbsolute = (value) => this.normalizeMediaUrl(value);

      if (typeof attachment === 'string') {
        return toAbsolute(attachment);
      }

      if (typeof attachment === 'object') {
        return {
          ...attachment,
          data: toAbsolute(attachment.data),
          url: toAbsolute(attachment.url),
        };
      }

      return attachment;
    },

    findOptimisticIndex(serverMsg) {
      // try to locate an optimistic local message that matches serverMsg
      // Search in reverse (most recent first)
      for (let i = this.messages.length - 1; i >= 0; i--) {
        const m = this.messages[i];
        if (!m || !m.optimistic) continue;

        // match by id if server returned same id
        if (serverMsg.id && m.id === serverMsg.id) return i;

        // match by text
        if (m.message && serverMsg.message && m.message === serverMsg.message) return i;

        // match by attachment - if optimistic has attachment and server has attachment
        // Server returns attachment as string path, optimistic has object with data/filename
        if (m.attachment && serverMsg.attachment) {
          // Compare IDs as strings (they may be numbers or strings)
          if (String(m.sender_id) === String(serverMsg.sender_id) && 
              String(m.receiver_id) === String(serverMsg.receiver_id)) {
            return i;
          }
        }
      }
      return -1;
    },
    // ================= SOCKET =================
    initSocket() {
      // use composable
      this.socketApi = createSocket(buildApiUrl(''));

      const token = localStorage.getItem('token');
      this.socketApi.connect(this.userId, {
        connect: (id) => {
          console.log("Socket connected:", id);
          this.selfOnline = true;
          this.loadFriendPresence();
        },
        disconnect: (reason) => {
          console.log("Socket disconnected:", reason);
          this.selfOnline = false;
        },
        connect_error: (err) => {
          console.error("Socket connect_error", err);
          if (err && err.message && (err.message === 'Token revoked' || err.message === 'Auth error' || err.message === 'No token')) {
            alert('Authentication error: please login again');
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            this.$router.push('/login');
          }
        },
        presence_update: (data) => {
          if (!data || !data.userId) return;
          this.friendPresence = {
            ...this.friendPresence,
            [String(data.userId)]: {
              isOnline: !!data.isOnline,
              lastActive: data.lastActive || null
            }
          };
        },
        friend_request: () => {
          this.loadRequests();
          this.loadSentRequests();
        },
        friend_request_updated: () => {
          this.loadRequests();
          this.loadSentRequests();
        },
        new_message: (msg) => {
          console.log("Received new_message", msg);
          const peerId = String(msg.sender_id) === String(this.userId) ? String(msg.receiver_id) : String(msg.sender_id);
          if (String(msg.sender_id) !== String(this.userId) && !this.mutedFriendIds.map(String).includes(String(msg.sender_id))) {
            this.playNotificationSound();
          }
          if (peerId && peerId !== String(this.userId)) {
            this.friendPresence = {
              ...this.friendPresence,
              [peerId]: {
                isOnline: true,
                lastActive: new Date().toISOString()
              }
            };
          }
          if (!this.activeFriend) return;
          if (!(String(msg.sender_id) === String(this.activeFriend.id) || String(msg.receiver_id) === String(this.activeFriend.id))) return;

          // If server returned an id that we already have, dedupe
          if (msg.id && this.messages.some(m => m.id === msg.id)) {
            console.log("Duplicate message ignored", msg.id);
            return;
          }

          // Try to find an optimistic message and replace it
          const idx = this.findOptimisticIndex(msg);
          const payload = {
            ...msg,
            attachment: this.normalizeAttachmentUrl(msg.attachment),
            mine: String(msg.sender_id) === String(this.userId),
            senderAvatar: String(msg.sender_id) === String(this.userId)
              ? null
              : (this.normalizeMediaUrl(msg.sender_avatar) || (this.activeFriend && this.activeFriend.profile_picture) || null)
          };
          if (idx > -1) {
            this.messages.splice(idx, 1, payload);
            return;
          }

          this.messages.push(payload);
        },
        // Updated message in real-time
        message_updated: (msg) => {
          if (!msg || !msg.id) return;
          const i = this.messages.findIndex(m => m && m.id === msg.id);
          const existing = i > -1 ? this.messages[i] : null;
          const payload = {
            ...msg,
            attachment: this.normalizeAttachmentUrl(msg.attachment),
            mine: String(msg.sender_id) === String(this.userId),
            senderAvatar: String(msg.sender_id) === String(this.userId)
              ? null
              : (this.normalizeMediaUrl(msg.sender_avatar) || (existing && existing.senderAvatar) || (this.activeFriend && this.activeFriend.profile_picture) || null)
          };
          if (i > -1) this.messages.splice(i, 1, payload);
          else this.messages.push(payload);
        },
        // Deleted message in real-time
        message_deleted: (msg) => {
          if (!msg || !msg.id) return;
          const i = this.messages.findIndex(m => m && m.id === msg.id);
          if (i > -1) this.messages.splice(i, 1);
        },
        // Group message received
        new_group_message: (msg) => {
          console.log("Received new_group_message", msg);
          if (String(msg.sender_id) !== String(this.userId) && !this.mutedGroupIds.map(String).includes(String(msg.group_id))) {
            this.playNotificationSound();
          }
          if (!this.activeGroup || String(this.activeGroup.id) !== String(msg.group_id)) return;
          
          // dedupe
          if (msg.id && this.groupMessages.some(m => m.id === msg.id)) return;
          
          this.groupMessages.push({
            ...msg,
            attachment: this.normalizeAttachmentUrl(msg.attachment),
            mine: String(msg.sender_id) === String(this.userId)
          });
        },
        // Group created
        group_created: (group) => {
          console.log("Group created", group);
          this.loadGroups();
        },
        // Group message updated
        group_message_updated: (msg) => {
          if (!msg || !msg.id || String(msg.group_id) !== String(this.activeGroup?.id)) return;
          const i = this.groupMessages.findIndex(m => m && m.id === msg.id);
          if (i > -1) {
            this.groupMessages.splice(i, 1, {
              ...this.groupMessages[i],
              message: msg.message,
              edited: true
            });
          }
        },
        // Group message deleted
        group_message_deleted: (msg) => {
          if (!msg || !msg.id || String(msg.group_id) !== String(this.activeGroup?.id)) return;
          const i = this.groupMessages.findIndex(m => m && m.id === msg.id);
          if (i > -1) this.groupMessages.splice(i, 1);
        },
        group_updated_members: (data) => {
          this.loadGroups();
          if (this.activeGroup && String(this.activeGroup.id) === String(data.group_id)) {
            this.loadGroupMembers(this.activeGroup.id);
          }
        },
        group_updated: (data) => {
          if (!data || !data.id) return;
          const gid = String(data.id);
          const normalizedAvatar = this.normalizeMediaUrl(data.avatar);

          this.groups = (this.groups || []).map(g =>
            String(g.id) === gid ? { ...g, avatar: normalizedAvatar } : g
          );

          if (this.activeGroup && String(this.activeGroup.id) === gid) {
            this.activeGroup = { ...this.activeGroup, avatar: normalizedAvatar };
          }
        },
        group_member_left: (data) => {
          this.loadGroups();
          if (!data || !data.group_id) return;

          if (this.activeGroup && String(this.activeGroup.id) === String(data.group_id)) {
            this.loadGroupMembers(this.activeGroup.id);
          }
        },
        group_member_removed: (data) => {
          this.loadGroups();
          if (!data || !data.group_id) return;

          const removedUserId = String(data.user_id);
          if (removedUserId === String(this.userId)) {
            if (this.activeGroup && String(this.activeGroup.id) === String(data.group_id)) {
              this.activeGroup = null;
              this.groupMessages = [];
              this.groupMembers = [];
              alert('Bol si odstránený zo skupiny.');
            }
            return;
          }

          if (this.activeGroup && String(this.activeGroup.id) === String(data.group_id)) {
            this.loadGroupMembers(this.activeGroup.id);
          }
        },
        group_theme_changed: (data) => {
          if (!data || !data.group_id) return;
          const gid = String(data.group_id);

          this.groups = (this.groups || []).map(g =>
            String(g.id) === gid
              ? {
                  ...g,
                  theme_id: data.theme_id || g.theme_id || 'default',
                  theme_permission: data.theme_permission || g.theme_permission || 'admin_only'
                }
              : g
          );

          if (this.activeGroup && String(this.activeGroup.id) === gid) {
            this.activeGroup = {
              ...this.activeGroup,
              theme_id: data.theme_id || this.activeGroup.theme_id || 'default',
              theme_permission: data.theme_permission || this.activeGroup.theme_permission || 'admin_only'
            };
            this.groupThemePermission = this.activeGroup.theme_permission || 'admin_only';
            this.groupCanEditTheme = this.computeCanEditGroupTheme();

            const themeId = this.activeGroup.theme_id || 'default';
            const themeColors = this.getThemeColors(themeId);
            this.applyThemeLocal({ id: themeId, ...themeColors });
          }
        },
        theme_changed: (data) => {
          console.log('Theme changed received', data);
          const senderId = String(data.sender_id);
          const receiverId = String(data.receiver_id);
          const selfId = String(this.userId);
          const otherUserId = senderId === selfId ? receiverId : senderId;
          if (!otherUserId) return;

          // Always persist theme for this private chat pair.
          const chatKey = this.getChatKey(otherUserId);
          localStorage.setItem(chatKey, data.themeId);

          // Apply immediately only when this exact chat is currently open.
          if (this.activeFriend && String(this.activeFriend.id) === otherUserId) {
            const themeColors = this.getThemeColors(data.themeId);
            this.applyThemeLocal({ id: data.themeId, ...themeColors });
          }
        },
        force_logout: () => {
          console.log('Force logout received from server');
          // clear token and user id and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          alert('You have been logged out');
          this.$router.push('/login');
        }
      }, token);
    },



    // ================= NICKNAMES =================
    loadNicknames() {
      // Load all nicknames from localStorage
      this.nicknames = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nickname_')) {
          const friendId = key.replace('nickname_', '');
          this.nicknames[friendId] = localStorage.getItem(key);
        }
      }
    },

    updateNickname(friendId, nickname) {
      // Update nickname in state and localStorage
      if (nickname) {
        this.nicknames[friendId] = nickname;
        localStorage.setItem(`nickname_${friendId}`, nickname);
      } else {
        delete this.nicknames[friendId];
        localStorage.removeItem(`nickname_${friendId}`);
      }
      // Trigger re-render
      this.$forceUpdate();
    },

    loadFriendPrefs() {
      try {
        this.friendNotes = JSON.parse(localStorage.getItem('friendNotes') || '{}');
        this.pinnedFriendIds = JSON.parse(localStorage.getItem('pinnedFriendIds') || '[]');
        this.mutedFriendIds = JSON.parse(localStorage.getItem('mutedFriendIds') || '[]');
        this.mutedGroupIds = JSON.parse(localStorage.getItem('mutedGroupIds') || '[]');
        this.blockedFriendIds = JSON.parse(localStorage.getItem('blockedFriendIds') || '[]');
        this.friendsFilter = localStorage.getItem('friendsFilter') || 'all';
        this.friendsSort = localStorage.getItem('friendsSort') || 'pinned';
      } catch (e) {
        console.warn('Failed to load friend preferences', e);
      }
    },

    saveFriendPrefs() {
      localStorage.setItem('friendNotes', JSON.stringify(this.friendNotes || {}));
      localStorage.setItem('pinnedFriendIds', JSON.stringify(this.pinnedFriendIds || []));
      localStorage.setItem('mutedFriendIds', JSON.stringify(this.mutedFriendIds || []));
      localStorage.setItem('mutedGroupIds', JSON.stringify(this.mutedGroupIds || []));
      localStorage.setItem('blockedFriendIds', JSON.stringify(this.blockedFriendIds || []));
      localStorage.setItem('friendsFilter', this.friendsFilter || 'all');
      localStorage.setItem('friendsSort', this.friendsSort || 'pinned');
    },

    setFriendsFilter(val) {
      this.friendsFilter = val || 'all';
      this.saveFriendPrefs();
    },

    setFriendsSort(val) {
      this.friendsSort = val || 'pinned';
      this.saveFriendPrefs();
    },

    togglePinFriend(user) {
      const id = String(user.id);
      const set = new Set((this.pinnedFriendIds || []).map(String));
      if (set.has(id)) set.delete(id);
      else set.add(id);
      this.pinnedFriendIds = Array.from(set);
      this.saveFriendPrefs();
    },

    toggleMuteFriend(user) {
      const id = String(user.id);
      const set = new Set((this.mutedFriendIds || []).map(String));
      if (set.has(id)) set.delete(id);
      else set.add(id);
      this.mutedFriendIds = Array.from(set);
      this.saveFriendPrefs();
    },

    isGroupMuted(group) {
      if (!group || !group.id) return false;
      return (this.mutedGroupIds || []).map(String).includes(String(group.id));
    },

    toggleMuteGroup(group) {
      if (!group || !group.id) return;
      const id = String(group.id);
      const set = new Set((this.mutedGroupIds || []).map(String));
      if (set.has(id)) set.delete(id);
      else set.add(id);
      this.mutedGroupIds = Array.from(set);
      this.saveFriendPrefs();
    },

    toggleBlockFriend(user) {
      const id = String(user.id);
      const isCurrentlyBlocked = this.blockedFriendIds.includes(id);

      // On block, ask for confirmation with impact message.
      if (!isCurrentlyBlocked) {
        this.showConfirmDialog(
          'Blokovať používateľa?',
          `Naozaj chceš blokovať ${user.username}? Po blokovaní si nebudete môcť navzájom posielať správy.`,
          'Blokovať',
          'Zrušiť',
          async () => {
            await this.performBlockToggle(user, false);
          }
        );
        return;
      }

      // Unblock immediately without extra confirmation.
      this.performBlockToggle(user, true);
    },

    async performBlockToggle(user, isCurrentlyBlocked) {
      const id = String(user.id);
      const token = localStorage.getItem('token');

      // Optimistic UI update (works without refresh)
      const set = new Set((this.blockedFriendIds || []).map(String));
      if (isCurrentlyBlocked) set.delete(id);
      else set.add(id);
      this.blockedFriendIds = Array.from(set);
      this.saveFriendPrefs();

      const endpoint = isCurrentlyBlocked ? '/api/friends/unblock' : '/api/friends/block';

      try {
        const res = await fetch(this.apiUrl(endpoint), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            userId: this.userId,
            blockedId: user.id
          })
        });

        const data = await res.json();
        if (!res.ok || !data || !data.ok) {
          throw new Error((data && data.error) || `HTTP ${res.status}`);
        }
      } catch (err) {
        // Rollback optimistic state on failure
        const rollback = new Set((this.blockedFriendIds || []).map(String));
        if (isCurrentlyBlocked) rollback.add(id);
        else rollback.delete(id);
        this.blockedFriendIds = Array.from(rollback);
        this.saveFriendPrefs();
        console.error('Error in block/unblock:', err);
        alert('Nepodarilo sa zmeniť stav blokovania. Skús to znova.');
      }
    },

    openFriendProfile(user) {
      this.friendProfile = {
        show: true,
        user: {
          ...user,
          profile_picture: this.normalizeMediaUrl(user?.profile_picture)
        }
      };
    },

    editFriendNote(user) {
      const key = String(user.id);
      const current = this.friendNotes[key] || '';
      const next = window.prompt(`Poznámka pre ${user.username}:`, current);
      if (next === null) return;

      const trimmed = String(next).trim();
      if (trimmed) this.friendNotes = { ...this.friendNotes, [key]: trimmed };
      else {
        const clone = { ...this.friendNotes };
        delete clone[key];
        this.friendNotes = clone;
      }
      this.saveFriendPrefs();
    },

    async fetchFromBackend(path, options = {}) {
      const res = await fetch(this.apiUrl(path), options);
      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        data = null;
      }
      if (!res.ok) {
        throw { res, data };
      }
      return { res, data };
    },
    apiUrl(path) {
      return buildApiUrl(path);
    },

    async loadFriendPresence() {
      try {
        const res = await fetch(this.apiUrl(`/api/friends/${this.userId}/presence`));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        const map = {};
        (rows || []).forEach(r => {
          if (!r || !r.userId) return;
          map[String(r.userId)] = {
            isOnline: !!r.isOnline,
            lastActive: r.lastActive || null
          };
        });
        this.friendPresence = map;
      } catch (e) {
        console.warn('Failed to load friend presence', e);
      }
    },

    async removeFriend(user) {
      if (!user || !user.id) return;
      this.showConfirmDialog(
        'Odstrániť priateľa?',
        `Naozaj chceš odstrániť ${user.username} z priateľov?`,
        'Odstrániť',
        'Zrušiť',
        async () => {
          await this.performRemoveFriend(user);
        }
      );
    },

    async performRemoveFriend(user) {
      try {
        const res = await fetch(this.apiUrl('/api/friends/remove'), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, friendId: user.id })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert((data && data.error) || 'Nepodarilo sa odstrániť priateľa');
          return;
        }

        await this.loadFriends();
        await this.loadFriendPresence();

        if (this.activeFriend && String(this.activeFriend.id) === String(user.id)) {
          this.activeFriend = null;
          this.messages = [];
        }

        if (this.undoToast.timerId) clearTimeout(this.undoToast.timerId);
        this.undoToast = {
          show: true,
          message: `${user.username} bol odstránený z priateľov`,
          friendId: String(user.id),
          timerId: setTimeout(() => {
            this.undoToast = { show: false, message: '', friendId: null, timerId: null };
          }, 5000)
        };
      } catch (err) {
        console.error('Remove friend failed', err);
        alert('Chyba pri odstraňovaní priateľa');
      }
    },

    async undoRemoveFriend() {
      if (!this.undoToast.friendId) return;
      try {
        const res = await fetch(this.apiUrl('/api/friends/restore'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, friendId: this.undoToast.friendId })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert((data && data.error) || 'Nepodarilo sa obnoviť priateľa');
          return;
        }

        if (this.undoToast.timerId) clearTimeout(this.undoToast.timerId);
        this.undoToast = { show: false, message: '', friendId: null, timerId: null };
        await this.loadFriends();
        await this.loadFriendPresence();
      } catch (err) {
        console.error('Undo remove friend failed', err);
      }
    },

    // ================= CHAT =================
    async loadFriends() {
      try {
        const { data } = await this.fetchFromBackend(`/api/friends/${this.userId}`);
        this.friends = Array.isArray(data)
          ? data.map(f => ({ ...f, profile_picture: this.normalizeMediaUrl(f.profile_picture) }))
          : [];
      } catch (err) {
        console.error('Failed to load friends', err);
        this.friends = [];
      }
    },

    async selectFriend(friend) {
      this.stopGroupPolling();
      this.activeGroup = null; // clear group selection
      this.activeFriend = friend;

      // Load blocked status
      const friendId = String(friend.id);
      this.haveIBlockedCurrentFriend = this.blockedFriendIds.includes(friendId);
      try {
        const resAmBlocked = await fetch(this.apiUrl(`/api/friends/${this.userId}/am-i-blocked?byUserId=${friend.id}`));
        const dataAmBlocked = await resAmBlocked.json();
        this.amIBlockedByCurrentFriend = dataAmBlocked.amBlocked || false;
      } catch (err) {
        console.error("Error checking if blocked:", err);
        this.amIBlockedByCurrentFriend = false;
      }

      // Apply this friend's theme immediately to avoid visual bleed while fetch is in-flight.
      const selectedFriendId = String(friend.id);
      const chatKey = this.getChatKey(friend.id);
      const savedTheme = localStorage.getItem(chatKey) || 'default';
      const themeColors = this.getThemeColors(savedTheme);
      this.applyThemeLocal({ id: savedTheme, ...themeColors });

      const res = await fetch(this.apiUrl(`/api/chat/messages?user1=${this.userId}&user2=${friend.id}`));
      const data = await res.json();

      // Ignore stale response if user switched chat meanwhile.
      if (!this.activeFriend || String(this.activeFriend.id) !== selectedFriendId || this.activeGroup) return;

      this.messages = data.map(m => ({
        ...m,
        attachment: this.normalizeAttachmentUrl(m.attachment),
        mine: m.sender_id == this.userId,
        senderAvatar: m.sender_id == this.userId
          ? null
          : (this.normalizeMediaUrl(m.sender_avatar) || friend.profile_picture || null)
      }));
    },

    sendMessage(payload) {
      // edit flow: if payload carries editTarget, route to edit
      if (payload && typeof payload === 'object' && payload.editTarget) {
        this.editMessage({ ...payload.editTarget, message: payload.text });
        return;
      }

      // check if payload is a reply (has message and replyTo)
      const isReply = payload && typeof payload === 'object' && payload.replyTo;
      const isAttachment = payload && typeof payload === 'object' && payload.attachment && !Array.isArray(payload);
      const messageText = isReply ? payload.message : (payload !== undefined && !isAttachment ? payload : this.newMessage);
      if ((messageText === undefined || messageText === "") && !isAttachment) return;
      if (!this.activeFriend) return;

      const base = {
        sender_id: this.userId,
        receiver_id: this.activeFriend.id
      };

      let msg;
      if (isReply) {
        msg = { ...base, message: messageText, reply_to_id: payload.replyTo.id, replyTo: payload.replyTo };
      } else if (isAttachment) {
        msg = { ...base, message: '', attachment: payload.attachment };
      } else {
        msg = { ...base, message: messageText };
      }

      // create optimistic message
      const tempId = `tmp_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      const optimisticMsg = { ...msg, id: tempId, mine: true, optimistic: true, created_at: new Date().toISOString(), senderAvatar: this.selfAvatar };
      this.messages.push(optimisticMsg);

      // only clear local input when it originated here (not for attachments)
      if (!isAttachment) this.newMessage = "";

      // send via socket if available
      if (this.socketApi && this.socketApi.socket && this.socketApi.socket.connected) {
        this.socketApi.emit("send_message", msg, (res) => {
          // ack from server after saving
          if (res && res.ok && res.payload) {
            const p = res.payload;
            const normalizedPayload = {
              ...p,
              attachment: this.normalizeAttachmentUrl(p.attachment),
              mine: true,
              senderAvatar: this.selfAvatar
            };
            // try to replace optimistic message
            const idx = this.findOptimisticIndex(p);
            if (idx > -1) {
              this.messages.splice(idx, 1, normalizedPayload);
            } else if (!this.messages.some(m => m.id && p.id && m.id === p.id)) {
              this.messages.push(normalizedPayload);
            }
          } else {
            console.warn("Message send failed ack:", res);
          }
        });
      } else {
        // fallback: save via REST
        const token = localStorage.getItem('token');
        fetch(this.apiUrl('/api/chat/messages'), {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(msg)
        })
          .then(r => r.json())
          .then(data => {
            const p = (data && data.payload) ? data.payload : null;
            if (p) {
              const normalizedPayload = {
                ...p,
                attachment: this.normalizeAttachmentUrl(p.attachment),
                mine: true,
                senderAvatar: this.selfAvatar
              };
              const idx = this.findOptimisticIndex(p);
              if (idx > -1) this.messages.splice(idx, 1, normalizedPayload);
              else this.messages.push(normalizedPayload);
            } else {
              // leave optimistic message as-is (no server id)
            }
          })
          .catch(err => console.error("REST fallback failed:", err));
      }
      
      // Clear reply state
      this.replyToMessage = null;
    },

    async editMessage(message) {
      if (!message || !message.id) return;
      const token = localStorage.getItem('token');

      try {
        const res = await fetch(this.apiUrl(`/api/chat/messages/${message.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ message: message.message, user_id: this.userId })
        });

        const data = await res.json();
        if (data && data.ok) {
          const idx = this.messages.findIndex(m => m && m.id === message.id);
          if (idx > -1) {
            this.messages.splice(idx, 1, { ...this.messages[idx], message: message.message, edited: true });
          }
        } else {
          alert((data && data.error) || 'Chyba pri úprave správy');
        }
      } catch (err) {
        console.error('Error editing message:', err);
        alert('Chyba pri úprave správy: ' + err.message);
      }
    },

    async deleteMessage(message) {
      if (!message || !message.id) return;
      
      this.showConfirmDialog(
        'Vymazať správu?',
        'Táto správa bude natrvalo odstránená.',
        'Vymazať',
        'Zrušiť',
        async () => {
          await this.performDeleteMessage(message);
        }
      );
    },

    async performDeleteMessage(message) {
      const token = localStorage.getItem('token');

      try {
        const res = await fetch(this.apiUrl(`/api/chat/messages/${message.id}`), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ user_id: this.userId })
        });

        const data = await res.json();
        if (data && data.ok) {
          const idx = this.messages.findIndex(m => m && m.id === message.id);
          if (idx > -1) this.messages.splice(idx, 1);
        } else {
          alert((data && data.error) || 'Chyba pri mazaní správy');
        }
      } catch (err) {
        console.error('Error deleting message:', err);
        alert('Chyba pri mazaní správy: ' + err.message);
      }
    },

    // ================= FRIENDS =================
    async loadAllUsers() {
      try {
        const { data } = await this.fetchFromBackend(`/api/users?userId=${this.userId}`);
        this.allUsers = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('Failed to load users', err);
        this.allUsers = [];
      }
    },

    async sendRequest(user) {
      try {
        const { data } = await this.fetchFromBackend('/api/friends/request', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUser: this.userId,
            toUser: user.id
          })
        });

        await this.loadRequests();
        await this.loadSentRequests();
        return;
      } catch (error) {
        const serverMessage = String((error && error.data && (error.data.message || error.data.error)) || error?.message || '');
        const normalizedMessage = serverMessage.toLowerCase();
        const alreadyPending = normalizedMessage.includes('už odoslan')
          || normalizedMessage.includes('uz odoslan')
          || normalizedMessage.includes('čaká')
          || normalizedMessage.includes('caka')
          || normalizedMessage.includes('exist');

        if (alreadyPending) {
          await this.loadRequests();
          await this.loadSentRequests();
          return;
        }

        alert(serverMessage || 'Žiadosť sa nepodarilo odoslať');
      }
    },

    async loadRequests() {
      try {
        const { data } = await this.fetchFromBackend(`/api/friends/requests/${this.userId}`);
        this.requests = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('Failed to load requests', err);
        this.requests = [];
      }
    },

    async loadSentRequests() {
      try {
        const { data } = await this.fetchFromBackend(`/api/friends/requests/${this.userId}/sent`);
        this.sentRequests = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('Failed to load sent requests', err);
        this.sentRequests = [];
      }
    },

    async cancelSentRequest(user) {
      try {
        await this.fetchFromBackend('/api/friends/request/cancel', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUser: this.userId,
            toUser: user.id
          })
        });

        await this.loadRequests();
        await this.loadSentRequests();
      } catch (error) {
        const serverMessage = String((error && error.data && (error.data.message || error.data.error)) || error?.message || '');
        alert(serverMessage || 'Žiadosť sa nepodarilo zrušiť');
      }
    },

    async acceptRequest(req) {
      await fetch(this.apiUrl('/api/friends/accept'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: this.userId,
          friendId: req.id
        })
      });
      this.loadFriends();
      this.loadRequests();
      this.loadSentRequests();
    },

    async declineRequest(req) {
      await fetch(this.apiUrl('/api/friends/decline'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: this.userId,
          friendId: req.id
        })
      });
      this.loadRequests();
      this.loadSentRequests();
    },

    // Logout: revoke token and disconnect sockets
    async logout() {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        await fetch(this.apiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.warn('Logout request failed', e);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      this.selfOnline = false;
      if (this.socketApi) this.socketApi.disconnect();
      this.$router.push('/login');
    }
    ,
    openSettings() {
      this.showSettings = true;
    },
    async refreshProfile() {
      try {
        const res = await fetch(this.apiUrl(`/api/profile/${this.userId}`));
        const data = await res.json();
        if (data && data.profile_picture) {
          const normalized = this.normalizeMediaUrl(data.profile_picture);
          this.selfAvatar = normalized;
          localStorage.setItem('profile_picture', normalized);
        } else {
          this.selfAvatar = null;
          localStorage.removeItem('profile_picture');
        }
      } catch (e) {
        console.warn('Failed to refresh profile', e);
      }
    },
    getThemeColors(themeId) {
      const themes = {
        default: { chatBg: '#f0f2f5', myBubble: '#1877f2', myText: '#ffffff', theirBubble: '#e4e6eb', theirText: '#000000' },
        dark: { chatBg: '#1a1a1a', myBubble: '#0084ff', myText: '#ffffff', theirBubble: '#3a3a3a', theirText: '#e4e6eb' },
        ocean: { chatBg: '#e6f3f5', myBubble: '#0d7377', myText: '#ffffff', theirBubble: '#14ffec', theirText: '#000000' },
        sunset: { chatBg: '#fff5e6', myBubble: '#ff6b35', myText: '#ffffff', theirBubble: '#ffe5d9', theirText: '#333333' },
        forest: { chatBg: '#f0f5f0', myBubble: '#2d6a4f', myText: '#ffffff', theirBubble: '#d8f3dc', theirText: '#1b4332' },
        purple: { chatBg: '#f5f0ff', myBubble: '#7209b7', myText: '#ffffff', theirBubble: '#e0aaff', theirText: '#3c096c' },
        night: { chatBg: '#0f0f23', myBubble: '#6c5ce7', myText: '#ffffff', theirBubble: '#2d3561', theirText: '#a29bfe' },
        rose: { chatBg: '#fff0f5', myBubble: '#d63447', myText: '#ffffff', theirBubble: '#ffccd5', theirText: '#333333' }
      };
      return themes[themeId] || themes.default;
    },
    getChatKey(friendId) {
      const ids = [this.userId, friendId].sort();
      return `chatTheme_${ids[0]}_${ids[1]}`;
    },
    getGroupThemeKey(groupId) {
      return `groupTheme_${groupId}`;
    },
    isCurrentUserGroupAdmin() {
      if (!this.activeGroup) return false;
      if (String(this.activeGroup.created_by) === String(this.userId)) return true;
      const me = (this.groupMembers || []).find(m => String(m.id) === String(this.userId));
      return !!(me && (me.role === 'admin' || Number(me.is_admin) === 1));
    },
    computeCanEditGroupTheme() {
      return this.isCurrentUserGroupAdmin() || this.groupThemePermission === 'all_members';
    },
    async loadGroupThemeSettings(groupId) {
      try {
        const res = await fetch(this.apiUrl(`/api/groups/${groupId}/theme-settings?userId=${this.userId}`));
        const data = await res.json();
        if (!res.ok || !data.ok) {
          this.groupThemePermission = this.activeGroup?.theme_permission || 'admin_only';
          this.groupCanEditTheme = this.computeCanEditGroupTheme();
          return;
        }
        if (!this.activeGroup || String(this.activeGroup.id) !== String(groupId)) return;

        this.groupThemePermission = data.themePermission || 'admin_only';
        this.groupCanEditTheme = !!data.canEdit;
        this.activeGroup = {
          ...this.activeGroup,
          theme_id: data.themeId || 'default',
          theme_permission: this.groupThemePermission
        };

        const themeColors = this.getThemeColors(this.activeGroup.theme_id || 'default');
        this.applyThemeLocal({ id: this.activeGroup.theme_id || 'default', ...themeColors });
      } catch (e) {
        console.warn('Failed to load group theme settings', e);
        this.groupThemePermission = this.activeGroup?.theme_permission || 'admin_only';
        this.groupCanEditTheme = this.computeCanEditGroupTheme();
      }
    },
    applyThemeLocal(theme) {
      this.currentTheme = theme.id;
      this.themeColors = theme;
      document.documentElement.style.setProperty('--chat-bg', theme.chatBg);
      document.documentElement.style.setProperty('--my-bubble', theme.myBubble);
      document.documentElement.style.setProperty('--my-text', theme.myText);
      document.documentElement.style.setProperty('--their-bubble', theme.theirBubble);
      document.documentElement.style.setProperty('--their-text', theme.theirText);
    },
    async applyTheme(theme) {
      console.log('applyTheme called with:', theme);

      if (this.activeGroup) {
        const canEditNow = this.groupCanEditTheme || this.isCurrentUserGroupAdmin();
        if (!canEditNow) {
          alert('Motív môže meniť iba admin skupiny.');
          await this.loadGroupThemeSettings(this.activeGroup.id);
          return;
        }

        const res = await fetch(this.apiUrl(`/api/groups/${this.activeGroup.id}/theme`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, themeId: theme.id })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert((data && data.error) || 'Nepodarilo sa zmeniť motív skupiny');
          await this.loadGroupThemeSettings(this.activeGroup.id);
          return;
        }

        // Apply locally only after server accepted the change.
        this.applyThemeLocal(theme);
        this.activeGroup = {
          ...this.activeGroup,
          theme_id: theme.id
        };
        this.groupThemePermission = data.payload?.theme_permission || this.groupThemePermission;
        this.groupCanEditTheme = this.computeCanEditGroupTheme();
        return;
      }

      this.applyThemeLocal(theme);
      
      // Save theme for this chat and notify other user
      if (this.activeFriend) {
        const chatKey = this.getChatKey(this.activeFriend.id);
        localStorage.setItem(chatKey, theme.id);
        
        // Emit theme change via socket
        if (this.socketApi && this.socketApi.socket && this.socketApi.socket.connected) {
          const payload = {
            sender_id: String(this.userId),
            receiver_id: String(this.activeFriend.id),
            themeId: theme.id
          };
          console.log('Emitting theme_change:', payload);
          this.socketApi.emit('theme_change', payload);
        } else {
          console.warn('Socket not connected, cannot emit theme_change');
          console.log('Socket API:', this.socketApi);
          console.log('Socket:', this.socketApi?.socket);
          console.log('Socket connected:', this.socketApi?.socket?.connected);
        }
      } else {
        console.warn('No active friend, cannot emit theme_change');
      }
    },
    openGroupThemes() {
      const canOpen = this.groupCanEditTheme || this.isCurrentUserGroupAdmin();
      if (!canOpen) {
        alert('Motív môže meniť iba admin skupiny.');
        return;
      }
      this.showThemes = true;
    },
    async setGroupThemePermission(mode) {
      if (!this.activeGroup) return;
      try {
        const res = await fetch(this.apiUrl(`/api/groups/${this.activeGroup.id}/theme-permission`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, mode })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert((data && data.error) || 'Nepodarilo sa zmeniť oprávnenie motívu');
          return;
        }
        this.groupThemePermission = mode;
        this.groupCanEditTheme = this.computeCanEditGroupTheme();
      } catch (e) {
        console.error('Error setting group theme permission', e);
      }
    },
    showConfirmDialog(title, message, confirmText, cancelText, onConfirm) {
      this.confirmDialog = {
        show: true,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          this.closeConfirmDialog();
          if (onConfirm) onConfirm();
        }
      };
    },
    closeConfirmDialog() {
      this.confirmDialog = {
        show: false,
        title: '',
        message: '',
        confirmText: 'Áno',
        cancelText: 'Zrušiť',
        onConfirm: null
      };
    },

    // ================= GROUPS =================
    async loadGroups() {
      try {
        const res = await fetch(this.apiUrl(`/api/groups/${this.userId}`));
        const data = await res.json();
        this.groups = Array.isArray(data)
          ? data.map(g => ({ ...g, avatar: this.normalizeMediaUrl(g.avatar) }))
          : [];
      } catch (err) {
        console.error('Error loading groups:', err);
      }
    },

    async selectGroup(group) {
      this.activeGroup = group;
      this.activeFriend = null; // clear friend selection
      this.groupThemePermission = group.theme_permission || 'admin_only';
      this.groupCanEditTheme = String(group.created_by) === String(this.userId) || this.groupThemePermission === 'all_members';

      // Apply this group's theme immediately to avoid visual bleed while fetch is in-flight.
      const selectedGroupId = String(group.id);
      const initialThemeId = group.theme_id || 'default';
      const groupThemeColors = this.getThemeColors(initialThemeId);
      this.applyThemeLocal({ id: initialThemeId, ...groupThemeColors });

      try {
        const res = await fetch(this.apiUrl(`/api/groups/${group.id}/messages`));
        const data = await res.json();
        console.log('DEBUG group messages API response:', data);

        // Ignore stale response if user switched away meanwhile.
        if (!this.activeGroup || String(this.activeGroup.id) !== selectedGroupId || this.activeFriend) return;

        this.groupMessages = data.map(m => ({
          ...m,
          attachment: this.normalizeAttachmentUrl(m.attachment),
          mine: String(m.sender_id) === String(this.userId)
        }));
        console.log('DEBUG groupMessages after map:', this.groupMessages);

        this.startGroupPolling(group.id);

        await this.loadGroupMembers(group.id);
        await this.loadGroupThemeSettings(group.id);
      } catch (err) {
        console.error('Error loading group:', err);
      }
    },
    startGroupPolling(groupId) {
      this.stopGroupPolling();
      const id = String(groupId);
      this.groupPollTimer = setInterval(async () => {
        if (!this.activeGroup || String(this.activeGroup.id) !== id) return;
        try {
          const res = await fetch(this.apiUrl(`/api/groups/${id}/messages`));
          if (!res.ok) return;
          const data = await res.json();
          if (!this.activeGroup || String(this.activeGroup.id) !== id) return;
          this.groupMessages = (data || []).map(m => ({
            ...m,
            attachment: this.normalizeAttachmentUrl(m.attachment),
            mine: String(m.sender_id) === String(this.userId)
          }));

          // Fallback sync in case realtime event is missed.
          await this.loadGroupThemeSettings(id);
        } catch (e) {
          // ignore transient polling errors
        }
      }, 2500);
    },
    stopGroupPolling() {
      if (this.groupPollTimer) {
        clearInterval(this.groupPollTimer);
        this.groupPollTimer = null;
      }
    },
    async loadGroupMembers(groupId) {
      const membersRes = await fetch(this.apiUrl(`/api/groups/${groupId}/members`));
      const members = await membersRes.json();
      if (!this.activeGroup || String(this.activeGroup.id) !== String(groupId)) return;
      this.groupMembers = (Array.isArray(members) ? members : []).map(m => ({
        ...m,
        profile_picture: this.normalizeMediaUrl(m.profile_picture)
      }));
      this.groupCanEditTheme = this.computeCanEditGroupTheme();
    },

    async updateGroupAvatar(avatarDataUrl) {
      if (!this.activeGroup || !avatarDataUrl) return;
      try {
        const uploadRes = await fetch(this.apiUrl('/api/upload'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: `group_${this.activeGroup.id}_${Date.now()}`,
            data: avatarDataUrl
          })
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.ok) {
          alert((uploadJson && uploadJson.error) || 'Nepodarilo sa nahrať avatar skupiny');
          return;
        }

        const avatarPath = uploadJson.url;
        const saveRes = await fetch(this.apiUrl(`/api/groups/${this.activeGroup.id}/avatar`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, avatar: avatarPath })
        });
        const saveJson = await saveRes.json();
        if (!saveRes.ok || !saveJson.ok) {
          alert((saveJson && saveJson.error) || 'Nepodarilo sa uložiť avatar skupiny');
          return;
        }

        const normalized = this.normalizeMediaUrl(saveJson.avatar || avatarPath);
        this.activeGroup = { ...this.activeGroup, avatar: normalized };
        this.groups = (this.groups || []).map(g =>
          String(g.id) === String(this.activeGroup.id) ? { ...g, avatar: normalized } : g
        );
      } catch (err) {
        console.error('Error updating group avatar:', err);
        alert('Chyba pri nahrávaní avataru skupiny');
      }
    },
    async leaveActiveGroup() {
      if (!this.activeGroup) return;

      this.showConfirmDialog(
        'Opustiť skupinu?',
        `Naozaj chceš opustiť skupinu ${this.activeGroup.name}?`,
        'Opustiť',
        'Zrušiť',
        async () => {
          await this.performLeaveActiveGroup();
        }
      );
    },
    async performLeaveActiveGroup() {
      if (!this.activeGroup) return;
      try {
        const groupId = this.activeGroup.id;
        const res = await fetch(this.apiUrl(`/api/groups/${groupId}/leave`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId })
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert((data && data.error) || 'Nepodarilo sa opustiť skupinu');
          return;
        }

        this.activeGroup = null;
        this.groupMessages = [];
        this.groupMembers = [];
        this.replyToGroupMessage = null;
        this.stopGroupPolling();
        await this.loadGroups();
      } catch (err) {
        console.error('Error leaving group:', err);
        alert('Chyba pri opúšťaní skupiny');
      }
    },
    async removeGroupMember(member) {
      if (!this.activeGroup || !member) return;

      this.showConfirmDialog(
        'Odstrániť člena?',
        `Naozaj chceš odstrániť ${member.username} zo skupiny?`,
        'Odstrániť',
        'Zrušiť',
        async () => {
          await this.performRemoveGroupMember(member);
        }
      );
    },
    async promoteGroupMember(member) {
      if (!this.activeGroup || !member) return;

      this.showConfirmDialog(
        'Povýšiť na admina?',
        `Naozaj chceš povýšiť ${member.username} na admina skupiny?`,
        'Povýšiť',
        'Zrušiť',
        async () => {
          await this.performPromoteGroupMember(member);
        }
      );
    },
    async performPromoteGroupMember(member) {
      if (!this.activeGroup || !member) return;
      try {
        const res = await fetch(this.apiUrl(`/api/groups/${this.activeGroup.id}/members/${member.id}/promote`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId })
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert((data && data.error) || 'Nepodarilo sa povýšiť člena');
          return;
        }

        await this.loadGroupMembers(this.activeGroup.id);
      } catch (err) {
        console.error('Error promoting group member:', err);
        alert('Chyba pri povýšení člena');
      }
    },
    async demoteGroupMember(member) {
      if (!this.activeGroup || !member) return;

      this.showConfirmDialog(
        'Znížiť admina?',
        `Naozaj chceš znížiť ${member.username} späť na člena?`,
        'Znížiť',
        'Zrušiť',
        async () => {
          await this.performDemoteGroupMember(member);
        }
      );
    },
    async performDemoteGroupMember(member) {
      if (!this.activeGroup || !member) return;
      try {
        const res = await fetch(this.apiUrl(`/api/groups/${this.activeGroup.id}/members/${member.id}/demote`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId })
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert((data && data.error) || 'Nepodarilo sa znížiť admina');
          return;
        }

        await this.loadGroupMembers(this.activeGroup.id);
      } catch (err) {
        console.error('Error demoting group member:', err);
        alert('Chyba pri znižovaní admina');
      }
    },
    async performRemoveGroupMember(member) {
      if (!this.activeGroup || !member) return;
      try {
        const res = await fetch(this.apiUrl(`/api/groups/${this.activeGroup.id}/members/${member.id}`), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId })
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert((data && data.error) || 'Nepodarilo sa odstrániť člena');
          return;
        }

        this.groupMembers = this.groupMembers.filter(m => String(m.id) !== String(member.id));
        this.loadGroups();
      } catch (err) {
        console.error('Error removing group member:', err);
        alert('Chyba pri odstraňovaní člena');
      }
    },

    async createGroup(groupData) {
      try {
        let groupAvatar = null;

        // Upload avatar if provided and fail fast when upload cannot be completed.
        if (groupData.avatar) {
          const uploadRes = await fetch(this.apiUrl('/api/upload'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: `group_${this.userId}_${Date.now()}`,
              data: groupData.avatar
            })
          });
          const uploadJson = await uploadRes.json();
          if (!uploadRes.ok || !uploadJson.ok || !uploadJson.url) {
            alert((uploadJson && uploadJson.error) || 'Nepodarilo sa nahrať avatar skupiny');
            return;
          }
          groupAvatar = uploadJson.url;
        }

        const res = await fetch(this.apiUrl('/api/groups'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...groupData,
             created_by: this.userId,
             avatar: groupAvatar
          })
        });

        const data = await res.json();
        if (data.ok) {
          this.showCreateGroup = false;
          this.loadGroups();
        } else {
          alert(data.error || 'Chyba pri vytváraní skupiny');
        }
      } catch (err) {
        console.error('Error creating group:', err);
        alert('Chyba pri vytváraní skupiny');
      }
    },

    sendGroupMessage(payload) {
      if (!this.activeGroup) return;

      const isReply = payload && typeof payload === 'object' && payload.replyTo;
      const isAttachment = payload && typeof payload === 'object' && payload.attachment && !Array.isArray(payload);
      const messageText = isReply ? payload.message : (isAttachment ? '' : payload);

      const msg = {
        group_id: this.activeGroup.id,
        sender_id: this.userId,
        message: messageText,
        attachment: isAttachment ? payload.attachment : null,
        reply_to_id: isReply ? payload.replyTo.id : null,
        replyTo: isReply ? payload.replyTo : null
      };

      // optimistic message
      const tempId = `tmp_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      const optimisticMsg = {
        ...msg,
        id: tempId,
        mine: true,
        optimistic: true,
        created_at: new Date().toISOString(),
        username: this.currentUsername,
        profile_picture: this.selfAvatar,
        replyTo: isReply ? payload.replyTo : null
      };
      this.groupMessages.push(optimisticMsg);

      const persistViaRest = async () => {
        try {
          const r = await fetch(this.apiUrl(`/api/groups/${this.activeGroup.id}/messages`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg)
          });
          const data = await r.json();
          const p = (data && data.payload) ? data.payload : null;
          if (p) {
            const normalizedPayload = {
              ...p,
              attachment: this.normalizeAttachmentUrl(p.attachment),
              mine: true
            };
            const idx = this.groupMessages.findIndex(m => m.id === tempId);
            if (idx > -1) this.groupMessages.splice(idx, 1, normalizedPayload);
            else if (!this.groupMessages.some(m => m.id && p.id && m.id === p.id)) this.groupMessages.push(normalizedPayload);
          }
        } catch (err) {
          console.error("REST group send failed:", err);
        }
      };

      // send via socket
      if (this.socketApi && this.socketApi.socket && this.socketApi.socket.connected) {
        this.socketApi.emit("send_group_message", msg, (res) => {
          if (res && res.ok && res.payload) {
            const p = res.payload;
            const normalizedPayload = {
              ...p,
              attachment: this.normalizeAttachmentUrl(p.attachment),
              mine: true
            };
            const idx = this.groupMessages.findIndex(m => m.id === tempId);
            if (idx > -1) {
              this.groupMessages.splice(idx, 1, normalizedPayload);
            } else if (!this.groupMessages.some(m => m.id && p.id && m.id === p.id)) {
              this.groupMessages.push(normalizedPayload);
            }
          } else {
            console.warn("Group message send failed ack:", res);
            persistViaRest();
          }
        });
      } else {
        // fallback: REST API
        persistViaRest();
      }
      
      // Clear reply state
      this.replyToGroupMessage = null;
    },

    async editGroupMessage(message) {
      if (!message || !message.id || !this.activeGroup) return;
      const token = localStorage.getItem('token');

      try {
        const res = await fetch(this.apiUrl(`/api/groups/${this.activeGroup.id}/messages/${message.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ message: message.message, user_id: this.userId })
        });

        const data = await res.json();
        if (data && data.ok) {
          const idx = this.groupMessages.findIndex(m => m && m.id === message.id);
          if (idx > -1) {
            this.groupMessages.splice(idx, 1, { ...this.groupMessages[idx], message: message.message, edited: true });
          }
        } else {
          alert((data && data.error) || 'Chyba pri úprave správy');
        }
      } catch (err) {
        console.error('Error editing group message:', err);
        alert('Chyba pri úprave správy: ' + err.message);
      }
    },

    async deleteGroupMessage(message) {
      if (!message || !message.id || !this.activeGroup) return;
      
      this.showConfirmDialog(
        'Vymazať správu?',
        'Táto správa bude natrvalo odstránená.',
        'Vymazať',
        'Zrušiť',
        async () => {
          await this.performDeleteGroupMessage(message);
        }
      );
    },

    async performDeleteGroupMessage(message) {
      const token = localStorage.getItem('token');

      try {
        const res = await fetch(this.apiUrl(`/api/groups/${this.activeGroup.id}/messages/${message.id}`), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ user_id: this.userId })
        });

        const data = await res.json();
        if (data && data.ok) {
          const idx = this.groupMessages.findIndex(m => m && m.id === message.id);
          if (idx > -1) this.groupMessages.splice(idx, 1);
        } else {
          alert((data && data.error) || 'Chyba pri mazaní správy');
        }
      } catch (err) {
        console.error('Error deleting group message:', err);
        alert('Chyba pri mazaní správy: ' + err.message);
      }
    }
  }
};
</script>

<style>
.chat-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  max-width: 100%;
  background: #f0f2f5;
  overflow: hidden;

/* LEFT */
.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #ddd;
  padding: 10px;
  overflow-y: auto;
}

.tabs {
  display: flex;
  margin-bottom: 10px;
}

.tabs > div {
  flex: 1;
  text-align: center;
  padding: 10px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tabs > div.active {
  border-bottom: 2px solid #1877f2;
  font-weight: bold;
}

.friend {
  padding: 10px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.friend:hover {
  background: #eee;
}

.friend.active {
  background: #1877f2;
  color: white;
}

/* RIGHT */
.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.profile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.profile-dialog {
  width: min(92vw, 360px);
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);
  text-align: center;
  position: relative;
}

.profile-close {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #111827;
  cursor: pointer;
}

.profile-avatar {
  width: 86px;
  height: 86px;
  border-radius: 999px;
  overflow: hidden;
  margin: 0 auto 12px;
  display: grid;
  place-items: center;
  background: #eef2f7;
  font-weight: 700;
  color: #334155;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.undo-toast {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  background: #111827;
  color: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1250;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
}

.undo-toast button {
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: transparent;
  color: #fff;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
}

html.dark-mode .profile-dialog {
  background: #0b0b0b;
  color: #e5e7eb;
}

html.dark-mode .profile-close {
  background: #111111;
  color: #e5e7eb;
}

html.dark-mode .profile-avatar {
  background: #111111;
  color: #cbd5e1;
}

html.dark-mode .undo-toast {
  background: #0b0b0b;
  border: 1px solid #1f2937;
}

.chat-header {
  padding: 15px;
  background: white;
  border-bottom: 1px solid #ddd;
  font-weight: bold;
  font-size: 22px;
}

@media (max-width: 600px) {
  .chat-header {
    padding: 28px 0 28px 0;
    font-size: 28px;
    min-height: 64px;
    letter-spacing: 0.01em;
  }
}
}

.messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.message {
  background: #e4e6eb;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 10px;
  max-width: 60%;
}

.message.mine {
  background: #1877f2;
  color: white;
  margin-left: auto;
}

.input-area {
  display: flex;
  padding: 10px;
  background: white;
  border-top: 1px solid #ddd;
}

input {
  flex: 1;
  padding: 10px;
  border-radius: 20px;
  border: 1px solid #ccc;
}

button {
  margin-left: 5px;
  padding: 5px 10px;
  border-radius: 20px;
  border: none;
  background: #1877f2;
  color: white;
  cursor: pointer;
}

.empty-chat {
  margin: auto;
  color: #777;
}
.tabs {
  display: flex;
  margin-bottom: 10px;
  position: relative;
  z-index: 10;
}

.tabs div {
  flex: 1;
  text-align: center;
  padding: 10px;
  cursor: pointer;
  user-select: none;
}

@media (max-width: 900px) {
  .chat-layout {
    height: 100dvh;
    width: 100%;
  }
}

</style>
