<template>
  <div class="tabs">
    <div :class="{ active: activeTab === 'chats' }" @click="$emit('change','chats')">Čet</div>
    <div :class="{ active: activeTab === 'friends' }" @click="$emit('change','friends')">Priatelia</div>
    <div :class="{ active: activeTab === 'requests' }" @click="$emit('change','requests')">Žiadosti</div>
  </div>
</template>

<script>
export default {
  props: { activeTab: { type: String, default: 'chats' } }
};
</script>

<style scoped>
.tabs { display:flex; border-bottom:1px solid #eee }
.tabs > div { flex:1; padding:10px 12px; text-align:center; cursor:pointer; font-weight:500; color:#555; transition:all 0.2s ease }
.tabs > div:hover:not(.active) { background:#f5f5f5; color:#333 }
.tabs > div.active { color:#1877f2; border-bottom:3px solid #1877f2; margin-bottom:-1px; font-weight:600 }

/* ===== DARK MODE ===== */
html.dark-mode .tabs { border-bottom-color: #1f2937; }
html.dark-mode .tabs > div { color: #9ca3af; }
html.dark-mode .tabs > div:hover:not(.active) { background: #0b0b0b; color: #e5e7eb; }
html.dark-mode .tabs > div.active { color: #60a5fa; border-bottom-color: #60a5fa; }
</style>
