/* Avatar skupiny v kruhu, 120x120px, biely okraj, tieň */
.group-avatar-preview-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  position: relative;
  margin: 0 auto 16px auto;
}
.group-avatar-preview-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
/* Odstránenie starých kruhových štýlov, ktoré by mohli spôsobovať konflikt */
.group-avatar-profile-style, .group-avatar-circle-fix, .avatar-preview-truecircle, .avatar-circle-crop, .avatar-crop-inner {
  all: unset;
}
<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Vytvoriť skupinu</h3>
        <button class="modal-close-x" @click="$emit('close')" aria-label="Zavrieť">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>Názov skupiny</label>
          <input v-model="name" type="text" placeholder="Zadaj názov...">
        </div>
        

        <div class="form-group" style="align-items:center;display:flex;flex-direction:column;gap:8px;">
          <label>Profilová fotka skupiny</label>
          <div class="group-avatar-preview-circle" @click="$refs.avatarFileInput.click()" style="cursor:pointer;width:120px;height:120px;">
            <img v-if="groupAvatarPreview" :src="groupAvatarPreview" alt="avatar" style="width:120px;height:120px;object-fit:cover;border-radius:50%;display:block;" />
            <span v-else style="font-size:2.5rem;color:#555;">{{ name ? name[0].toUpperCase() : '?' }}</span>
            <input ref="avatarFileInput" type="file" accept="image/*" style="display:none" @change="onAvatarSelected" />
            <button v-if="groupAvatarPreview" @click.stop="cancelAvatarPreview" style="position:absolute;top:2px;right:2px;background:#fff;border:none;border-radius:50%;width:28px;height:28px;box-shadow:0 2px 8px rgba(0,0,0,0.12);cursor:pointer;font-size:18px;">✕</button>
          </div>
          <div style="font-size:12px;color:#888;">Klikni na kruh pre nahranie obrázka</div>
        </div>
        
        <div class="form-group">
          <label>Pridať členov</label>
          <div class="member-search-wrap">
            <input
              v-model="memberQuery"
              type="text"
              placeholder="Hľadaj priateľa podľa mena..."
              @keydown.enter.prevent="addFirstMatch"
              @input="handleMemberInput">

            <div v-if="bestMatch" class="quick-match-row">
              <span class="quick-match-label">Nájdené:</span>
              <span class="quick-match-name">{{ bestMatch.username }}</span>
              <button class="quick-match-add" @click="addMember(bestMatch.id)">Pridať</button>
            </div>
          </div>

          <div v-if="selectedMemberObjects.length > 0" class="selected-members">
            <div
              v-for="friend in selectedMemberObjects"
              :key="`selected-${friend.id}`"
              class="selected-chip"
            >
              <div class="chip-avatar">
                <img v-if="friend.profile_picture" :src="friend.profile_picture" alt="" />
                <span v-else>{{ friend.username[0].toUpperCase() }}</span>
              </div>
              <span class="chip-name">{{ friend.username }}</span>
              <button class="chip-remove" @click="removeMember(friend.id)" aria-label="Odstrániť">✕</button>
            </div>
          </div>

          <div v-if="memberQuery.trim().length > 0 && !bestMatch" class="search-empty">
            Nenašiel sa žiadny priateľ.
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">Zrušiť</button>
        <button class="btn-create" @click="create" :disabled="!name || selectedMemberObjects.length === 0">Vytvoriť</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    friends: { type: Array, default: () => [] }
  },
  emits: ['close', 'create'],
  data() {
    return {
      name: '',
      selectedMembers: [],
      memberQuery: '',
      groupAvatarPreview: null,
      pendingAvatarData: null
    }
  },
  computed: {
    selectedMemberObjects() {
      const selected = new Set(this.selectedMembers.map(String));
      return (this.friends || []).filter(f => selected.has(String(f.id)));
    },
    filteredFriends() {

      const query = String(this.memberQuery || '').trim().toLowerCase();
      if (!query || query.length < 3) return [];

      const selected = new Set(this.selectedMembers.map(String));
      return (this.friends || [])
        .filter((f) => {
          if (selected.has(String(f.id))) return false;
          return String(f.username || '').toLowerCase().includes(query);
        })
        .slice(0, 8);
    },
    bestMatch() {
      const query = String(this.memberQuery || '').trim().toLowerCase();
      if (!query) return null;

      const prefix = this.filteredFriends.find(
        (f) => String(f.username || '').toLowerCase().startsWith(query)
      );
      return prefix || this.filteredFriends[0] || null;
    }
  },
  methods: {
    handleMemberInput() {
      // Keep method for potential future debounce; currently computed values drive UI.
    },
    addMember(id) {
      if (!this.selectedMembers.includes(id)) {
        this.selectedMembers.push(id);
      }
      this.memberQuery = '';
    },
    addFirstMatch() {
      if (this.bestMatch) {
        this.addMember(this.bestMatch.id);
      }
    },
     onAvatarSelected(event) {
       const file = event.target.files[0];
       if (!file) return;
       if (file.size > 5 * 1024 * 1024) {
         alert('Obrázok je príliš veľký. Maximálna veľkosť je 5MB.');
         return;
       }
       const reader = new FileReader();
       reader.onload = (e) => {
         this.groupAvatarPreview = e.target.result;
         this.pendingAvatarData = e.target.result;
       };
       reader.readAsDataURL(file);
       event.target.value = '';
     },
     cancelAvatarPreview() {
       this.groupAvatarPreview = null;
       this.pendingAvatarData = null;
       if (this.$refs.avatarFileInput) {
         this.$refs.avatarFileInput.value = '';
       }
     },
     removeMember(id) {
      this.selectedMembers = this.selectedMembers.filter(v => String(v) !== String(id));
    },
    create() {
      const trimmedName = String(this.name || '').trim();
      if (!trimmedName) return;
      this.$emit('create', {
        name: trimmedName,
        members: this.selectedMembers,
        avatar: this.pendingAvatarData
      });
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid #dbe7ff;
  box-shadow: 0 18px 40px rgba(30, 64, 175, 0.14);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e6eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.modal-close-x {
  all: unset;
  font-size: 36px;
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

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #0f172a;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccd0d5;
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.member-search-wrap input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #bfdbfe;
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  box-sizing: border-box;
}

.member-search-wrap input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.quick-match-row {
  margin-top: 8px;
  min-height: 38px;
  border: 1px solid #d6e4ff;
  border-radius: 10px;
  background: #f5f9ff;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
}

.quick-match-label {
  font-size: 12px;
  color: #64748b;
}

.quick-match-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-match-add {
  border: none;
  background: #1d4ed8;
  color: #fff;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.quick-match-add:hover {
  background: #1e40af;
}

.selected-members {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 4px 8px 4px 4px;
  border-radius: 999px;
  border: 1px solid #bfd5ff;
  .avatar-upload-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .avatar-upload-outer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 8px;
  }
  .avatar-preview-truecircle {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid #e4e6eb;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
  }
  .avatar-circle-crop {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
  }
  .avatar-crop-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
  }
  .avatar-crop-inner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    display: block;
  }
  .btn-cancel-avatar {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255,255,255,0.85);
    color: #333;
    border: none;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    transition: background 0.15s;
  }
  .btn-cancel-avatar:hover {
    background: #f87171;
    color: #fff;
  }
  .avatar-placeholder-truecircle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 2px dashed #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-size: 14px;
    flex-shrink: 0;
    background: #f3f4f6;
  }
            .btn-upload-avatar {
              padding: 8px 16px;
              background: #1877f2;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
            }
            .btn-upload-avatar:hover {
              background: #166fe5;
            }

  background: #ecf3ff;
}

.chip-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 11px;
  font-weight: 700;
  color: #1e3a8a;
}

.chip-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chip-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e3a8a;
}

.chip-remove {
  all: unset;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1e40af;
  font-size: 12px;
}

.chip-remove:hover {
  background: rgba(30, 64, 175, 0.14);
}

.search-empty {
  margin-top: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: #64748b;
  border: 1px solid #d6e4ff;
  border-radius: 10px;
  background: #f5f9ff;
}

.friend-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  flex-shrink: 0;
  color: #1e3a8a;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}


.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #e4e6eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel,
.btn-create {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel {
  background: #e4e6eb;
  color: #050505;
}

.btn-cancel:hover {
  background: #d8dadf;
}

.btn-create {
  background: #1877f2;
  color: white;
}

.btn-create:hover:not(:disabled) {
  background: #166fe5;
}

.btn-create:disabled {
  background: #e4e6eb;
  color: #bcc0c4;
  cursor: not-allowed;
}

/* ===== DARK MODE ===== */
html.dark-mode .modal-overlay { background: rgba(0, 0, 0, 0.7); }
html.dark-mode .modal-content { background: #0b0b0b; }
html.dark-mode .modal-header { border-bottom-color: #1f2937; }
html.dark-mode .modal-header h3 { color: #e5e7eb; }
html.dark-mode .modal-close-x { color: #e5e7eb; }
html.dark-mode .modal-close-x:hover { color: #e5e7eb; }
html.dark-mode .modal-close-x:focus,
html.dark-mode .modal-close-x:active { color: #e5e7eb; }
html.dark-mode .close-btn { color: #e5e7eb; }
html.dark-mode .close-btn:hover { background: rgba(255, 255, 255, 0.08); }
html.dark-mode .form-group label { color: #e5e7eb; }
html.dark-mode .form-group input,
html.dark-mode .form-group textarea { background: #111111; border-color: #1f2937; color: #e5e7eb; }
html.dark-mode .form-group input::placeholder,
html.dark-mode .form-group textarea::placeholder { color: #6b7280; }
html.dark-mode .member-search-wrap input { background: #111111; border-color: #1f2937; color: #e5e7eb; }
html.dark-mode .quick-match-row { border-color: #1f2937; background: #0b0b0b; }
html.dark-mode .quick-match-label { color: #94a3b8; }
html.dark-mode .quick-match-name { color: #e5e7eb; }
html.dark-mode .quick-match-add { background: #2563eb; }
html.dark-mode .quick-match-add:hover { background: #3b82f6; }
html.dark-mode .search-empty { color: #94a3b8; }
html.dark-mode .search-empty { border-color: #1f2937; background: #0b0b0b; }
html.dark-mode .friend-avatar { background: #111111; }
html.dark-mode .selected-chip { background: rgba(37, 99, 235, 0.16); border-color: rgba(96, 165, 250, 0.28); }
html.dark-mode .chip-avatar { background: #1e3a8a; color: #dbeafe; }
html.dark-mode .chip-name { color: #dbeafe; }
html.dark-mode .chip-remove { color: #bfdbfe; }
html.dark-mode .chip-remove:hover { background: rgba(191, 219, 254, 0.16); }
html.dark-mode .modal-footer { border-top-color: #1f2937; }
html.dark-mode .btn-cancel { background: #111111; color: #e5e7eb; }
html.dark-mode .btn-cancel:hover { background: #1a1a1a; }
html.dark-mode .btn-create { background: #2563eb; }
html.dark-mode .btn-create:hover:not(:disabled) { background: #3b82f6; }
html.dark-mode .btn-create:disabled { background: #1f2937; color: #6b7280; }
</style>
