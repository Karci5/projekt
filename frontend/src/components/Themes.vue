<template>
  <div class="themes-overlay" @click.self="$emit('close')">
    <div class="themes-modal">
          <button class="modal-close-x" @click="$emit('close')">✕</button>
          <div class="themes-header">
            <h2>Motívy</h2>
          </div>
      
      <div class="themes-grid">
        <div 
          v-for="theme in themes" 
          :key="theme.id"
          :class="['theme-card', { active: currentTheme === theme.id }]"
          @click="selectTheme(theme.id)"
        >
          <div class="theme-preview">
            <div class="preview-bg" :style="{ background: theme.chatBg }">
              <div class="preview-bubble mine" :style="{ background: theme.myBubble, color: theme.myText }">
                Moja správa
              </div>
              <div class="preview-bubble other" :style="{ background: theme.theirBubble, color: theme.theirText }">
                Ich správa
              </div>
            </div>
          </div>
          <div class="theme-name">{{ theme.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    selectedTheme: {
      type: String,
      default: 'default'
    }
  },
  data() {
    return {
      currentTheme: this.selectedTheme || 'default',
      themes: [
        {
          id: 'default',
          name: 'Predvolené',
          chatBg: '#f0f2f5',
          myBubble: '#1877f2',
          myText: '#ffffff',
          theirBubble: '#e4e6eb',
          theirText: '#000000'
        },
        {
          id: 'dark',
          name: 'Tmavý',
          chatBg: '#0f1115',
          myBubble: '#2f6fed',
          myText: '#ffffff',
          theirBubble: '#232834',
          theirText: '#e5e7eb'
        },
        {
          id: 'ocean',
          name: 'Oceán',
          chatBg: '#e6f3f5',
          myBubble: '#0d7377',
          myText: '#ffffff',
          theirBubble: '#14ffec',
          theirText: '#000000'
        },
        {
          id: 'sunset',
          name: 'Západ slnka',
          chatBg: '#fff5e6',
          myBubble: '#ff6b35',
          myText: '#ffffff',
          theirBubble: '#ffe5d9',
          theirText: '#333333'
        },
        {
          id: 'forest',
          name: 'Les',
          chatBg: '#f0f5f0',
          myBubble: '#2d6a4f',
          myText: '#ffffff',
          theirBubble: '#d8f3dc',
          theirText: '#1b4332'
        },
        {
          id: 'purple',
          name: 'Fialový',
          chatBg: '#f5f0ff',
          myBubble: '#7209b7',
          myText: '#ffffff',
          theirBubble: '#e0aaff',
          theirText: '#3c096c'
        },
        {
          id: 'rose',
          name: 'Ruža',
          chatBg: '#fff0f5',
          myBubble: '#d63447',
          myText: '#ffffff',
          theirBubble: '#ffccd5',
          theirText: '#333333'
        }
      ]
    };
  },
  watch: {
    selectedTheme(newVal) {
      this.currentTheme = newVal || 'default';
    }
  },
  methods: {
    selectTheme(themeId) {
      this.currentTheme = themeId;
      const theme = this.themes.find(t => t.id === themeId);
      if (theme) {
        this.$emit('theme-changed', theme);
      }
    }
  }
};
</script>

<style scoped>
.themes-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.themes-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.themes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.themes-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: background 0.15s;
}

.close-btn:hover {
  background: #f0f0f0;
}
.themes-modal {
  position: relative;
}
.modal-close-x {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  color: #111827;
  font-size: 36px;
  font-weight: 300;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  z-index: 10;
  box-shadow: none;
  transition: color 0.15s;
}
.modal-close-x:hover {
  color: #111827;
  background: none;
}

.modal-close-x:focus,
.modal-close-x:active {
  outline: none;
  background: none;
  box-shadow: none;
  color: #111827;
}

.themes-grid {
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  overflow-y: auto;
}

.theme-card {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-card.active {
  border-color: #1877f2;
  box-shadow: 0 0 0 1px #1877f2;
}

.theme-preview {
  aspect-ratio: 1;
  overflow: hidden;
}

.preview-bg {
  width: 100%;
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.preview-bubble {
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 11px;
  max-width: 80%;
  word-break: break-word;
}

.preview-bubble.mine {
  align-self: flex-end;
  margin-left: auto;
}

.preview-bubble.other {
  align-self: flex-start;
}

.theme-name {
  padding: 10px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  background: #f8f9fa;
}

@media (max-width: 768px) {
  .themes-modal {
    width: 95%;
    max-height: 85vh;
  }
  
  .themes-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    padding: 16px;
  }
  
  .themes-header h2 {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .themes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ===== DARK MODE ===== */
html.dark-mode .themes-overlay {
  background: rgba(0, 0, 0, 0.7);
}

html.dark-mode .themes-modal {
  background: #0b0b0b;
}

html.dark-mode .themes-header {
  border-bottom-color: #1f2937;
}

html.dark-mode .themes-header h2 {
  color: #e5e7eb;
}

html.dark-mode .close-btn {
  color: #9ca3af;
}

html.dark-mode .close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

html.dark-mode .modal-close-x {
  color: #e5e7eb;
}

html.dark-mode .modal-close-x:hover {
  color: #e5e7eb;
}

html.dark-mode .modal-close-x:focus,
html.dark-mode .modal-close-x:active {
  color: #e5e7eb;
}

html.dark-mode .theme-card {
  border-color: #1f2937;
}

html.dark-mode .theme-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

html.dark-mode .theme-card.active {
  border-color: #60a5fa;
  box-shadow: 0 0 0 1px #60a5fa;
}

html.dark-mode .theme-name {
  background: #111111;
  color: #e5e7eb;
}
</style>
