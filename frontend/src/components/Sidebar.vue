<template>
  <div class="sidebar">
    <div class="top-bar">
      <h3 class="brand">Četik</h3>
    </div>
    <div class="sidebar-body">
      <Tabs v-if="!hideTabs" :activeTab="activeTab" @change="$emit('change-tab', $event)" />

      <div v-if="activeTab === 'chats'">
        <FriendList
          :friends="friends"
          :nicknames="nicknames"
          :show-presence="showPresence"
          :presence-by-id="friendPresence"
          @select="$emit('select-friend', $event)"
        />
        <GroupsList :groups="groups" @select="$emit('select-group', $event)" @create-group="$emit('create-group')" />
      </div>
      <div v-else-if="activeTab === 'friends'">
        <div class="friends-controls">
          <select :value="friendsFilter" @change="$emit('set-friends-filter', $event.target.value)">
            <option value="all">Všetci</option>
            <option value="blocked">Blokovaní</option>
            <option value="muted">Stíšení</option>
            <option value="online">Online</option>
          </select>
          <select :value="friendsSort" @change="$emit('set-friends-sort', $event.target.value)">
            <option value="pinned">Pripnutí navrchu</option>
            <option value="az">A-Z</option>
            <option value="recent">Naposledy aktívni</option>
          </select>
        </div>
        <FriendList
          :friends="displayUsers"
          :nicknames="nicknames"
          :notes="friendNotes"
          :show-options="true"
          :show-presence="showPresence"
          :friend-ids="friends.map(f => f.id)"
          :pinned-ids="pinnedFriendIds"
          :muted-ids="mutedFriendIds"
          :blocked-ids="blockedFriendIds"
          :presence-by-id="friendPresence"
          @remove-friend="$emit('remove-friend', $event)"
          @toggle-pin="$emit('toggle-pin-friend', $event)"
          @toggle-mute="$emit('toggle-mute-friend', $event)"
          @toggle-block="$emit('toggle-block-friend', $event)"
          @view-profile="$emit('view-friend-profile', $event)"
          @edit-note="$emit('edit-friend-note', $event)"
          @write-message="$emit('write-message', $event)"
        />
      </div>

      <div v-else-if="activeTab === 'requests'">
        <UserSearch :value="searchUser" @update="$emit('update-search', $event)" />
        <RequestsList
          :requests="requests"
          :sent-requests="sentRequests"
          :discover-users="discoverUsers"
          @send-request="$emit('send-request', $event)"
          @cancel-sent-request="$emit('cancel-sent-request', $event)"
          @accept="$emit('accept-request', $event)"
          @decline="$emit('decline-request', $event)"
        />
      
    </div>

    <div class="profile-footer">
      <div style="position:relative;display:flex;align-items:center;">
        <button class="avatar-btn" @click="toggleMenu" aria-label="Profil"
          @mouseenter="showProfileModal = true" @mouseleave="onAvatarLeave">
          <template v-if="userAvatar">
            <img :src="userAvatar" alt="Profil" />
          </template>
          <template v-else>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="9" r="3"/>
              <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
            </svg>
          </template>
          <span v-if="showPresence" :class="['self-presence-dot', selfOnline ? 'online' : 'offline']"></span>
        </button>
        <ProfileSettingsModal
          v-if="showProfileModal"
          :user="{ username: currentUserName, avatar: userAvatar }"
          @close="showProfileModal = false"
          @mouseenter.native="profileModalHover = true"
          @mouseleave.native="onProfileModalLeave"
        />
      </div>
      <span class="user-name">{{ currentUserName }}</span>
      <div v-if="menuOpen" class="profile-menu" @mouseleave="menuOpen=false">
        <button class="menu-item" @click="openSettings">
          <span class="menu-item-icon" aria-hidden="true">⚙</span>
          <span class="menu-item-label">Nastavenia</span>
        </button>
        <button class="menu-item danger" @click="doLogout">
          <span class="menu-item-icon" aria-hidden="true">↩</span>
          <span class="menu-item-label">Odhlásiť</span>
        </button>
      </div>
    </div>
    </div>
  </div>
</template>

<script>
import Tabs from './Tabs.vue'
import FriendList from './FriendList.vue'
import UserSearch from './UserSearch.vue'
import RequestsList from './RequestsList.vue'
import GroupsList from './GroupsList.vue'

export default {
  props: {
    friends: Array,
    allUsers: Array,
    currentUserId: { type: [String, Number], default: null },
    requests: Array,
    sentRequests: { type: Array, default: () => [] },
    searchUser: String,
    activeTab: String,
    userAvatar: String,
    currentUserName: String,
    groups: Array,
    nicknames: { type: Object, default: () => ({}) },
    hideTabs: { type: Boolean, default: false },
    selfOnline: { type: Boolean, default: false },
    showPresence: { type: Boolean, default: true },
    friendNotes: { type: Object, default: () => ({}) },
    pinnedFriendIds: { type: Array, default: () => [] },
    mutedFriendIds: { type: Array, default: () => [] },
    blockedFriendIds: { type: Array, default: () => [] },
    friendPresence: { type: Object, default: () => ({}) },
    friendsFilter: { type: String, default: 'all' },
    friendsSort: { type: String, default: 'pinned' }
  },
  components: { Tabs, FriendList, UserSearch, RequestsList, GroupsList },
  data() {
    return {
      menuOpen: false
    };
  },
      onAvatarLeave() {
        setTimeout(() => {
          if (!this.profileModalHover) this.showProfileModal = false;
        }, 120);
      },
      onProfileModalLeave() {
        this.profileModalHover = false;
        this.showProfileModal = false;
      },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
    openSettings() {
      this.menuOpen = false;
      this.$emit('open-settings');
    },
    doLogout() {
      this.menuOpen = false;
      this.$emit('logout');
    }
  },
  computed: {
    displayUsers() {
      const toSet = (arr) => new Set((arr || []).map(v => String(v)));
      const pinnedSet = toSet(this.pinnedFriendIds);
      const mutedSet = toSet(this.mutedFriendIds);
      const blockedSet = toSet(this.blockedFriendIds);

      let list = [...(this.friends || [])];

      if (this.friendsFilter === 'blocked') list = list.filter(u => blockedSet.has(String(u.id)));
      if (this.friendsFilter === 'muted') list = list.filter(u => mutedSet.has(String(u.id)));
      if (this.friendsFilter === 'online') list = list.filter(u => this.friendPresence[String(u.id)] && this.friendPresence[String(u.id)].isOnline);

      if (this.friendsSort === 'az') {
        list.sort((a, b) => String(a.username || '').localeCompare(String(b.username || ''), 'sk'));
      } else if (this.friendsSort === 'recent') {
        list.sort((a, b) => {
          const ta = this.friendPresence[String(a.id)]?.lastActive ? new Date(this.friendPresence[String(a.id)].lastActive).getTime() : 0;
          const tb = this.friendPresence[String(b.id)]?.lastActive ? new Date(this.friendPresence[String(b.id)].lastActive).getTime() : 0;
          return tb - ta;
        });
      } else {
        list.sort((a, b) => {
          const ap = pinnedSet.has(String(a.id)) ? 1 : 0;
          const bp = pinnedSet.has(String(b.id)) ? 1 : 0;
          if (ap !== bp) return bp - ap;
          return String(a.username || '').localeCompare(String(b.username || ''), 'sk');
        });
      }

      return list;
    },
    discoverUsers() {
      const toSet = (arr) => new Set((arr || []).map(v => String(v)));
      const friendSet = toSet((this.friends || []).map(f => f.id));
      const incomingSet = toSet((this.requests || []).map(r => r.id));
      const sentSet = toSet((this.sentRequests || []).map(r => r.id));
      const selfId = this.currentUserId == null ? null : String(this.currentUserId);
      const search = String(this.searchUser || '').trim().toLowerCase();

      // Show suggestions only after entering at least 3 characters.
      if (search.length < 3) return [];

      return (this.allUsers || []).filter((u) => {
        const id = String(u.id);
        const username = String(u.username || '').trim().toLowerCase();
        if (selfId && id === selfId) return false;
        if (friendSet.has(id)) return false;
        if (incomingSet.has(id)) return false;
        if (sentSet.has(id)) return false;
        if (search && !username.startsWith(search)) return false;
        return true;
      }).sort((a, b) => String(a.username || '').localeCompare(String(b.username || ''), 'sk'));
    }
  }
}
</script>

<style scoped>

.sidebar { 
  width: 320px; 
  background: #fff; 
  border-right: 1px solid #ddd; 
  padding: 10px; 
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100vh;
}

.sidebar-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  overflow-x: hidden;
}

.friends-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.friends-controls select {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 12px;
  padding: 7px 8px;
  background: #fff;
  color: #111827;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: stretch;
  gap: 10px;
  padding: 6px 4px 10px;
}
.brand {
  margin: 0;
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 4px 0 6px;
  border-radius: 0;
  background: transparent;
  font-family: "Trebuchet MS", "Segoe UI", sans-serif;
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 0.03em;
  line-height: 1;
  text-align: center;
  transform: none;
  transform-origin: left center;
  color: #0f4cbd;
  box-shadow: none;
  text-shadow: none;
}

@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .brand {
    background: none;
    -webkit-text-fill-color: #0f4cbd;
    color: #0f4cbd;
  }
}

.profile-footer {
  margin-top: auto;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #f7f8fa;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.profile-footer:hover {
  background: #e9ebee;
}

.avatar-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  padding: 0;
  overflow: hidden;
  background: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.avatar-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.avatar-btn svg { color: #666; }

.self-presence-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: absolute;
  right: 3px;
  bottom: 0;
  border: 2px solid #f7f8fa;
  box-sizing: content-box;
}

.self-presence-dot.online { background: #22c55e; }
.self-presence-dot.offline { background: #9ca3af; }

.user-name {
  flex: 1;
  margin-left: 12px;
  font-weight: 500;
  font-size: 14px;
  color: #050505;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.profile-name {
  font-weight: 600;
  font-size: 14px;
  color: #050505;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-menu {
  position: absolute;
  bottom: 68px;
  left: 10px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.14);
  min-width: 224px;
  max-width: calc(100% - 20px);
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  z-index: 20;
  padding: 6px;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.menu-item:hover {
  background: #f1f5f9;
  transform: translateY(-1px);
}

.menu-item:active {
  transform: translateY(0);
}

.menu-item + .menu-item {
  border-top: 1px solid #f1f5f9;
}

.menu-item-icon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  background: #f1f5f9;
  color: #475569;
  flex-shrink: 0;
}

.menu-item-label {
  line-height: 1.2;
}

.menu-item.danger {
  color: #b91c1c;
}

.menu-item.danger .menu-item-icon {
  background: #fef2f2;
  color: #b91c1c;
}

.menu-item.danger:hover {
  background: #fff1f2;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: 100dvh;
    max-height: none;
    border-right: none;
    border-bottom: none;
    padding: 8px;
    gap: 8px;
  }

  .profile-footer {
    margin-bottom: calc(8px + env(safe-area-inset-bottom));
  }

  .friends-controls {
    grid-template-columns: 1fr;
  }
}

/* ===== DARK MODE ===== */
html.dark-mode .sidebar {
  background: #000000;
  border-right-color: #1f2937;
}

html.dark-mode .friends-controls select {
  background: #0b0b0b;
  border-color: #1f2937;
  color: #e5e7eb;
}

html.dark-mode .brand {
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

html.dark-mode .profile-footer {
  background: #0b0b0b;
}

html.dark-mode .profile-footer:hover {
  background: #111111;
}

html.dark-mode .avatar-btn {
  background: #0b0b0b;
}

html.dark-mode .self-presence-dot {
  border-color: #0b0b0b;
}

html.dark-mode .avatar-btn svg {
  color: #cbd5f5;
}

html.dark-mode .user-name,
html.dark-mode .profile-name {
  color: #e5e7eb;
}

html.dark-mode .profile-menu {
  background: #0b0b0b;
  border-color: #1f2937;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45);
}

html.dark-mode .menu-item {
  color: #e5e7eb;
}

html.dark-mode .menu-item:hover {
  background: #111827;
}

html.dark-mode .menu-item + .menu-item {
  border-top-color: #1f2937;
}

html.dark-mode .menu-item-icon {
  background: #111827;
  color: #cbd5e1;
}

html.dark-mode .menu-item.danger {
  color: #f87171;
}

html.dark-mode .menu-item.danger .menu-item-icon {
  background: rgba(248, 113, 113, 0.16);
  color: #f87171;
}

html.dark-mode .menu-item.danger:hover {
  background: rgba(220, 38, 38, 0.12);
}

  </style>
