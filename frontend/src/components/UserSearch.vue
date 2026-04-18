<template>
  <div class="search-wrap">
    <input type="text" :value="value" @input="$emit('update', $event.target.value)" placeholder="Vyhľadaj používateľa..." class="search-input" />
  </div>
</template>

<script>
export default {
  props: { value: { type: String, default: '' } }
};
</script>

<style scoped>
.search-wrap { display:flex; justify-content:center; margin-bottom:8px }
.search-input { width:90%; padding:6px 8px; border:1px solid #ccc; border-radius:8px; font-size:13px }

@media (max-width: 700px) {
  .search-wrap { padding: 0 10px; margin-bottom: 12px; }
  .search-input {
    width: 100%;
    font-size: 16px;
    padding: 12px 14px;
    border-radius: 10px;
  }
}

/* ===== DARK MODE ===== */
html.dark-mode .search-input { background: #111111; border-color: #1f2937; color: #e5e7eb; }
html.dark-mode .search-input::placeholder { color: #6b7280; }
</style>
