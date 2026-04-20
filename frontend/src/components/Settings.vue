<template>
  <div class="settings-page" :class="{ 'dark-mode': darkMode }">
    <div class="settings-header">
      <button class="back-button" @click="$emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/>
        </svg>
        Späť
      </button>
      <h2>Nastavenia</h2>
    </div>

    <div class="settings-content">
      <div class="preferences-grid">
        <div class="preferences-section">
          <h3>Vzhľad</h3>
          <div class="toggle-row">
            <div>
              <div class="toggle-title">Dark mode</div>
              <div class="toggle-subtitle">Tmavý vzhľad nastavení</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="darkMode" @change="saveDarkMode" />
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="preferences-section">
          <h3>Súkromie</h3>
          <div class="toggle-row">
            <div>
              <div class="toggle-title">Zobraziť online stav</div>
              <div class="toggle-subtitle">Ukáže ostatným, že si online</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="privacyShowOnline" @change="savePrivacySettings" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="toggle-row">
            <div>
              <div class="toggle-title">Zobraziť naposledy aktívny</div>
              <div class="toggle-subtitle">Priateľom sa zobrazí posledná aktivita</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="privacyShowLastSeen" @change="savePrivacySettings" />
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="preferences-section">
          <h3>Notifikácie</h3>
          <div class="toggle-row">
            <div>
              <div class="toggle-title">Zvuk správ</div>
              <div class="toggle-subtitle">Prehrá zvuk pri novej správe</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="notificationsSound" @change="saveNotificationSettings" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="toggle-row">
            <div>
              <div class="toggle-title">Nerušiť</div>
              <div class="toggle-subtitle">Vypne notifikácie v určenom čase</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="dndEnabled" @change="saveNotificationSettings" />
              <span class="slider"></span>
            </label>
          </div>
          <div v-if="dndEnabled" class="dnd-row">
            <label>
              Od
              <input type="time" v-model="dndFrom" @change="saveNotificationSettings" />
            </label>
            <label>
              Do
              <input type="time" v-model="dndTo" @change="saveNotificationSettings" />
            </label>
          </div>
        </div>
      </div>

      <div class="settings-grid">
        <div class="profile-section">
          <h3>Profil</h3>
          
          <div class="profile-picture-section">
            <div class="current-avatar">
              <img v-if="displayedProfilePicture" :src="displayedProfilePicture" alt="Profile" />
              <div v-else class="default-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="9" r="3"/>
                  <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                </svg>
              </div>
            </div>

            <p v-if="pendingProfilePictureData" class="preview-hint">
              Náhľad vybraného obrázka. Klikni na "Použiť obrázok" pre uloženie.
            </p>

            <div class="picture-actions">
              <input
                type="file"
                ref="fileInput"
                accept="image/*"
                @change="handleFileSelect"
                style="display: none"
              />
              <button @click="$refs.fileInput.click()" class="btn-primary">
                {{ pendingProfilePictureData ? 'Vybrať iný obrázok' : 'Nahrať obrázok' }}
              </button>

              <button v-if="pendingProfilePictureData" @click="applyProfilePictureUpload" class="btn-primary confirm-btn">
                Použiť obrázok
              </button>

              <button v-if="pendingProfilePictureData" @click="cancelProfilePreview" class="btn-secondary">
                Zrušiť náhľad
              </button>

              <button v-else-if="profilePicture" @click="removeProfilePicture" class="btn-secondary">
                Odstrániť
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Používateľské meno</label>
            <input
              v-model="username"
              type="text"
              placeholder="Zadajte meno"
              @input="onUsernameInput"
              @blur="updateUsername"
            />
          </div>
        </div>

        <div class="security-section">
          <h3>Bezpečnosť</h3>

          <div class="form-group">
            <label>Aktuálne heslo</label>
            <input
              v-model="currentPassword"
              type="password"
              placeholder="Zadaj aktuálne heslo"
            />
          </div>

          <div class="form-group">
            <label>Nové heslo</label>
            <input
              v-model="newPassword"
              type="password"
              placeholder="Minimálne 6 znakov"
            />
          </div>

          <div class="form-group">
            <label>Potvrď nové heslo</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Zopakuj nové heslo"
            />
          </div>

          <button class="btn-primary" @click="changePassword" :disabled="changingPassword">
            {{ changingPassword ? 'Ukladám...' : 'Zmeniť heslo' }}
          </button>
        </div>
      </div>


    <!-- Uložiť zmeny tlačidlo -->
    <div style="display: flex; justify-content: flex-end; margin-top: 32px;">
      <button class="btn-primary" @click="saveAllSettings">Uložiť zmeny</button>
    </div>
  </div>
</div>
</template>

<script>
import { apiUrl as buildApiUrl, toAbsoluteUploadUrl } from '../utils/backendUrl';

export default {
  emits: ['close', 'profile-updated', 'dark-mode-changed', 'privacy-changed', 'blocked-list-changed'],
  props: {
    userId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      username: '',
      profilePicture: null,
      originalUsername: '',
      darkMode: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      changingPassword: false,
      usernameSaveTimer: null,
      privacyShowOnline: true,
      privacyShowLastSeen: true,
      notificationsSound: true,
      dndEnabled: false,
      dndFrom: '22:00',
      dndTo: '07:00',
      blockedUsers: [],
      loadingBlockedUsers: false,
      unblockingUserId: null,
      pendingProfilePictureData: null
    }
  },
  computed: {
    displayedProfilePicture() {
      return this.pendingProfilePictureData || toAbsoluteUploadUrl(this.profilePicture);
    }
  },
  mounted() {
    this.darkMode = localStorage.getItem('uiDarkMode') === 'true';
    this.loadLocalSettings();
    this.loadProfile();
    this.loadBlockedUsers();
  },
  beforeUnmount() {
    if (this.usernameSaveTimer) clearTimeout(this.usernameSaveTimer);
  },
  methods: {
    apiUrl(path) {
      return buildApiUrl(path);
    },
    async saveAllSettings() {
      // Uloží všetky nastavenia naraz cez API
      const payload = {
        userId: this.userId,
        username: this.username,
        showOnline: this.privacyShowOnline,
        showLastSeen: this.privacyShowLastSeen,
        notificationsSound: this.notificationsSound,
        dndEnabled: this.dndEnabled,
        dndFrom: this.dndFrom,
        dndTo: this.dndTo,
        profilePicture: this.profilePicture
      };
      try {
        const res = await fetch(this.apiUrl('/api/profile/save-settings'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          this.$emit('profile-updated', payload);
          alert('Zmeny boli uložené.');
        } else {
          const err = await res.text();
          alert('Chyba pri ukladaní: ' + err);
        }
      } catch (e) {
        alert('Chyba pri ukladaní: ' + e.message);
      }
    },
    loadLocalSettings() {
      this.privacyShowOnline = localStorage.getItem('privacy_show_online') !== 'false';
      this.privacyShowLastSeen = localStorage.getItem('privacy_show_last_seen') !== 'false';
      this.notificationsSound = localStorage.getItem('notifications_sound') !== 'false';
      this.dndEnabled = localStorage.getItem('notifications_dnd_enabled') === 'true';
      this.dndFrom = localStorage.getItem('notifications_dnd_from') || '22:00';
      this.dndTo = localStorage.getItem('notifications_dnd_to') || '07:00';
    },
    async savePrivacySettings() {
      localStorage.setItem('privacy_show_online', String(this.privacyShowOnline));
      localStorage.setItem('privacy_show_last_seen', String(this.privacyShowLastSeen));
      // Uložiť aj do backendu
      try {
        await fetch('/api/profile/privacy-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            showOnline: this.privacyShowOnline
          })
        });
      } catch (e) {
        console.warn('Nepodarilo sa uložiť privacy nastavenie na backend:', e);
      }
      this.$emit('privacy-changed', {
        showOnline: this.privacyShowOnline,
        showLastSeen: this.privacyShowLastSeen
      });
    },
    saveNotificationSettings() {
      localStorage.setItem('notifications_sound', String(this.notificationsSound));
      localStorage.setItem('notifications_dnd_enabled', String(this.dndEnabled));
      localStorage.setItem('notifications_dnd_from', this.dndFrom || '22:00');
      localStorage.setItem('notifications_dnd_to', this.dndTo || '07:00');
    },
    async loadBlockedUsers() {
      this.loadingBlockedUsers = true;
      try {
        const res = await fetch(this.apiUrl(`/api/friends/${this.userId}/blocked`));
        const data = await res.json();
        this.blockedUsers = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('Failed to load blocked users:', err);
        this.blockedUsers = [];
      } finally {
        this.loadingBlockedUsers = false;
      }
    },
    async unblockUser(user) {
      if (!user || !user.id) return;
      this.unblockingUserId = String(user.id);
      try {
        const res = await fetch(this.apiUrl('/api/friends/unblock'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, blockedId: user.id })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert((data && data.error) || 'Nepodarilo sa odblokovať používateľa.');
          return;
        }

        this.blockedUsers = this.blockedUsers.filter(u => String(u.id) !== String(user.id));
        const current = JSON.parse(localStorage.getItem('blockedFriendIds') || '[]').map(String);
        const next = current.filter(id => id !== String(user.id));
        localStorage.setItem('blockedFriendIds', JSON.stringify(next));
        this.$emit('blocked-list-changed', next);
      } catch (err) {
        console.error('Failed to unblock user:', err);
        alert('Chyba pri odblokovaní používateľa.');
      } finally {
        this.unblockingUserId = null;
      }
    },
    formatBlockedAt(value) {
      if (!value) return 'neznámy čas';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return 'neznámy čas';
      return d.toLocaleString('sk-SK');
    },
    readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    getImageDimensions(dataUrl) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = dataUrl;
      });
    },
    saveDarkMode() {
      localStorage.setItem('uiDarkMode', String(this.darkMode));
      this.$emit('dark-mode-changed', this.darkMode);
    },
    async loadProfile() {
      try {
        const res = await fetch(this.apiUrl(`/api/profile/${this.userId}`));
        const data = await res.json();
        this.username = data.username || '';
        this.originalUsername = data.username || '';
        this.profilePicture = data.profile_picture || null;
        this.pendingProfilePictureData = null;
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    },
    
    async handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Obrázok je príliš veľký. Maximálna veľkosť je 5MB.');
        return;
      }

      // Najprv iba náhľad, bez okamžitého uploadu.
      try {
        const dataUrl = await this.readFileAsDataUrl(file);
        const { width, height } = await this.getImageDimensions(dataUrl);
        const minSide = Math.min(width, height);
        if (minSide < 256) {
          alert('Obrázok má príliš nízke rozlíšenie. Použi aspoň 256x256 px.');
          event.target.value = '';
          return;
        }
        this.pendingProfilePictureData = dataUrl;
      } catch (err) {
        console.error('Upload error:', err);
        alert('Chyba pri nahrávaní obrázka: ' + err.message);
      } finally {
        event.target.value = '';
      }
    },

    cancelProfilePreview() {
      this.pendingProfilePictureData = null;
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },

    async applyProfilePictureUpload() {
      if (!this.pendingProfilePictureData) return;
      try {
        const uploadRes = await fetch(this.apiUrl('/api/upload'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: `profile_${this.userId}_${Date.now()}`,
            data: this.pendingProfilePictureData
          })
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.ok) {
          console.error('Upload failed', uploadJson);
          alert('Nepodarilo sa nahrať obrázok.');
          return;
        }

        const imageUrl = uploadJson.url;
        this.profilePicture = imageUrl;
        this.pendingProfilePictureData = null;
        await this.saveProfilePicture(imageUrl);
      } catch (err) {
        console.error('Upload error:', err);
        alert('Chyba pri nahrávaní obrázka: ' + err.message);
      }
    },

    async saveProfilePicture(pictureData) {
      try {
        const res = await fetch(this.apiUrl('/api/profile/update-picture'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            profilePicture: pictureData
          })
        });

        if (res.ok) {
          // Emit immediately after successful save
          this.$emit('profile-updated');
          // Reload profile to confirm
          await this.loadProfile();
        } else {
          const errorData = await res.text();
          console.error('Server error:', errorData);
          alert('Chyba pri ukladaní obrázka: ' + errorData);
        }
      } catch (err) {
        console.error('Failed to save profile picture:', err);
        alert('Chyba pri ukladaní obrázka: ' + err.message);
      }
    },

    async removeProfilePicture() {
      this.profilePicture = null;
      this.pendingProfilePictureData = null;
      await this.saveProfilePicture(null);
    },

    onUsernameInput() {
      if (this.usernameSaveTimer) clearTimeout(this.usernameSaveTimer);
      this.usernameSaveTimer = setTimeout(() => {
        this.updateUsername();
      }, 450);
    },

    async updateUsername() {
      const nextUsername = String(this.username || '').trim();
      if (!nextUsername || nextUsername === this.originalUsername) {
        if (!nextUsername) this.username = this.originalUsername;
        return;
      }

      if (this.usernameSaveTimer) {
        clearTimeout(this.usernameSaveTimer);
        this.usernameSaveTimer = null;
      }

      if (!this.username.trim()) {
        this.username = this.originalUsername;
        return;
      }

      try {
        const res = await fetch(this.apiUrl('/api/profile/update-username'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            username: nextUsername
          })
        });

        if (res.ok) {
          this.username = nextUsername;
          this.originalUsername = nextUsername;
          localStorage.setItem('username', nextUsername);
          window.dispatchEvent(new CustomEvent('profile-updated', {
            detail: { username: nextUsername }
          }));
          this.$emit('profile-updated', { username: nextUsername });
        }
      } catch (err) {
        console.error('Failed to update username:', err);
        this.username = this.originalUsername;
      }
    },

    async changePassword() {
      if (this.changingPassword) return;

      if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
        alert('Vyplň všetky polia pre zmenu hesla.');
        return;
      }

      if (this.newPassword.length < 6) {
        alert('Nové heslo musí mať aspoň 6 znakov.');
        return;
      }

      if (this.newPassword !== this.confirmPassword) {
        alert('Nové heslá sa nezhodujú.');
        return;
      }

      this.changingPassword = true;
      try {
        const res = await fetch(this.apiUrl('/api/auth/change-password'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            currentPassword: this.currentPassword,
            newPassword: this.newPassword
          })
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data?.error || 'Nepodarilo sa zmeniť heslo.');
          return;
        }

        alert('Heslo bolo úspešne zmenené.');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      } catch (err) {
        console.error('Failed to change password:', err);
        alert('Chyba pri zmene hesla.');
      } finally {
        this.changingPassword = false;
      }
    }
  }
}
</script>

<style scoped>
.settings-page {
  background: #ffffff;
  height: 100dvh;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  position: fixed;
  inset: 0;
  z-index: 5000;
  isolation: isolate;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.settings-header {
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-button {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 10px 14px;
  border-radius: 8px;
  color: #1877f2;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
}

.back-button:hover {
  background: #f0f2f5;
  transform: translateX(-4px);
}

.settings-header h2 {
  margin: 0 auto;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  text-align: center;
  flex: 1;
}

.settings-content {
  padding: 40px 32px;
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preferences-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;
  order: -1;
}

.preferences-section {
  background: white;
  border-radius: 16px;
  padding: 24px 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-height: 180px;
}

.preferences-section h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 700;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 0;
}

.preferences-section .toggle-row + .toggle-row {
  margin-top: 8px;
}

.dnd-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.dnd-row label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #4b5563;
}

.dnd-row input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
  color: #111827;
}

.blocked-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.blocked-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
}

.blocked-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.blocked-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
}

.blocked-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  color: #374151;
  font-weight: 700;
}

.blocked-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.blocked-meta {
  font-size: 12px;
  color: #6b7280;
}

.blocked-empty {
  color: #6b7280;
  font-size: 14px;
}

.blocked-unblock {
  max-width: 140px;
}

.toggle-title {
  font-weight: 600;
  color: #1a1a1a;
}

.toggle-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: 0.2s;
  border-radius: 999px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.switch input:checked + .slider {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.switch input:checked + .slider:before {
  transform: translateX(20px);
}

.profile-section {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-height: auto;
}

.security-section {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-height: auto;
}

.security-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1a1a1a;
  font-size: 20px;
  font-weight: 700;
}

.profile-section h3 {
  margin-top: 0;
  margin-bottom: 28px;
  color: #1a1a1a;
  font-size: 20px;
  font-weight: 700;
}

.profile-picture-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 28px;
  padding: 32px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%);
  border-radius: 16px;
  border: 2px solid #e0e0e0;
}

.current-avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 4px solid white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
}

.current-avatar:hover {
  transform: scale(1.05);
}

.current-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.default-avatar {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.picture-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  min-width: 0;
  justify-content: center;
  max-width: 480px;
}

.preview-hint {
  margin: -8px 0 2px;
  font-size: 13px;
  color: #475569;
  text-align: center;
  font-weight: 500;
}

.profile-section .form-group {
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}

.profile-section .form-group label {
  text-align: center;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.confirm-btn {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: white;
  color: #666;
  border: 2px solid #e0e0e0;
  box-shadow: none;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #d0d0d0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Dark mode overrides */
.settings-page.dark-mode {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
}

.settings-page.dark-mode .settings-header {
  background: rgba(17, 24, 39, 0.95);
  color: #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
}

.settings-page.dark-mode .settings-header h2 {
  color: #e5e7eb;
}

.settings-page.dark-mode .back-button {
  color: #c7d2fe;
}

.settings-page.dark-mode .back-button:hover {
  background: rgba(255, 255, 255, 0.08);
}

.settings-page.dark-mode .preferences-section,
.settings-page.dark-mode .profile-section,
.settings-page.dark-mode .security-section {
  background: #111827;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.settings-page.dark-mode .preferences-section h3,
.settings-page.dark-mode .profile-section h3,
.settings-page.dark-mode .security-section h3,
.settings-page.dark-mode .toggle-title,
.settings-page.dark-mode .form-group label {
  color: #e5e7eb;
}

.settings-page.dark-mode .toggle-subtitle {
  color: #9ca3af;
}

.settings-page.dark-mode .dnd-row label {
  color: #9ca3af;
}

.settings-page.dark-mode .dnd-row input {
  background: #0b1020;
  border-color: #374151;
  color: #e5e7eb;
}

.settings-page.dark-mode .blocked-item {
  border-color: #374151;
  background: #0b1020;
}

.settings-page.dark-mode .blocked-name {
  color: #e5e7eb;
}

.settings-page.dark-mode .blocked-meta,
.settings-page.dark-mode .blocked-empty {
  color: #9ca3af;
}

.settings-page.dark-mode .blocked-avatar-placeholder {
  background: #1f2937;
  color: #cbd5e1;
}

.settings-page.dark-mode .profile-picture-section {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-color: #1f2937;
}

.settings-page.dark-mode .btn-secondary {
  background: transparent;
  color: #e5e7eb;
  border-color: #374151;
}

.settings-page.dark-mode .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.06);
}

.settings-page.dark-mode .preview-hint {
  color: #94a3b8;
}

.settings-page.dark-mode .form-group input {
  background: #0b1020;
  color: #e5e7eb;
  border-color: #374151;
}

.settings-page.dark-mode .form-group input:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.18);
}

@media (max-width: 768px) {
  .settings-header {
    padding: 20px;
  }

  .settings-content {
    padding: 24px 16px;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .preferences-grid {
    grid-template-columns: 1fr;
  }

  .profile-section {
    padding: 24px;
    min-height: auto;
  }

  .security-section {
    padding: 24px;
    min-height: auto;
  }

  .profile-picture-section {
    padding: 24px;
    flex-direction: column;
  }

  .current-avatar {
    width: 120px;
    height: 120px;
  }

  .picture-actions {
    flex-direction: column;
    min-width: 0;
    width: 100%;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .dnd-row {
    grid-template-columns: 1fr;
  }

  .blocked-item {
    flex-direction: column;
    align-items: stretch;
  }

  .blocked-unblock {
    max-width: none;
  }
}

@media (max-width: 480px) {
  .settings-header h2 {
    font-size: 20px;
  }

  .profile-section h3 {
    font-size: 18px;
  }

  .security-section h3 {
    font-size: 18px;
  }

  .current-avatar {
    width: 100px;
    height: 100px;
  }
}
</style>
