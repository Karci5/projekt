<template>
  <div class="requests-wrap">
    <div class="requests-section">
      <div class="requests-title">Poslať žiadosť</div>
      <div v-if="discoverUsers.length > 0" class="discover-list">
        <div v-for="u in discoverUsers" :key="`discover-${u.id}`" class="request-item discover-item">
          <span class="request-name">{{ u.username }}</span>
          <button class="send-btn" @click="$emit('send-request', u)">+ Pridať</button>
        </div>
      </div>
      <div v-else class="requests-empty small-empty">
        Zadaj aspoň 3 písmená na vyhľadanie používateľa.
      </div>
    </div>

    <div v-if="requests.length > 0" class="requests-section">
      <div class="requests-title">Prijaté žiadosti</div>
      <div v-for="r in requests" :key="`incoming-${r.id}`" class="request-item">
        <span class="request-name">{{ r.username }}</span>
        <div class="request-actions">
          <button class="accept-btn" @click="$emit('accept', r)">✔</button>
          <button class="decline-btn" @click="$emit('decline', r)">✖</button>
        </div>
      </div>
    </div>

    <div v-if="sentRequests.length > 0" class="requests-section">
      <div class="requests-title">Odoslané žiadosti</div>
      <div v-for="r in sentRequests" :key="`sent-${r.id}`" class="request-item sent-item">
        <div class="request-main">
          <span class="request-name">{{ r.username }}</span>
        </div>
        <div class="request-actions request-actions-sent">
          <button class="cancel-btn" @click="$emit('cancel-sent-request', r)">Zrušiť</button>
        </div>
      </div>
    </div>

    <div v-if="requests.length === 0 && sentRequests.length === 0" class="requests-empty">
      Nemáš žiadne žiadosti.
    </div>
  </div>
</template>

<script>
export default {
  props: {
    requests: { type: Array, default: () => [] },
    sentRequests: { type: Array, default: () => [] },
    discoverUsers: { type: Array, default: () => [] }
  }
};
</script>

<style scoped>
.requests-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.requests-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.requests-title {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 10px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(59,130,246,0.04);
}

.discover-item {
  background: #f8fafc;
}

.send-btn {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:hover {
  background: #1d4ed8;
}

.small-empty {
  padding: 12px 10px;
}

.sent-item {
  background: linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%);
  border-color: #bfdbfe;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.08);
}

.request-main {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.request-name {
  font-size: 16px;
  color: #1e293b;
  font-weight: 500;
}

.request-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.request-actions-sent {
  flex-shrink: 0;
  justify-content: flex-end;
}
.accept-btn {
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s;
}
.accept-btn:hover {
  background: #16a34a;
}
.decline-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s;
}
.decline-btn:hover {
  background: #dc2626;
}

.cancel-btn {
  background: #ffffff;
  color: #334155;
  border: 1px solid #d7e1ee;
  border-radius: 10px;
  min-height: 38px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.15s;
}

.cancel-btn:hover {
  background: #f8fafc;
  border-color: #bfd0e4;
}

.cancel-btn:active {
  transform: translateY(1px);
}

@media (max-width: 560px) {
  .request-item {
    padding: 12px;
    gap: 10px;
  }

  .request-name {
    font-size: 15px;
  }

  .cancel-btn {
    min-height: 34px;
    padding: 0 12px;
  }
}

.requests-empty {
  padding: 18px 14px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
}

/* ===== DARK MODE ===== */
html.dark-mode .request-item {
  background: #18181b;
  border-color: #27272a;
  color: #e5e7eb;
}
html.dark-mode .send-btn {
  background: #2563eb;
}
html.dark-mode .send-btn:hover {
  background: #3b82f6;
}
html.dark-mode .request-name {
  color: #e5e7eb;
}
html.dark-mode .requests-title {
  color: #94a3b8;
}
html.dark-mode .sent-item {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(15, 23, 42, 0.32) 100%);
  border-color: rgba(96, 165, 250, 0.2);
}
html.dark-mode .cancel-btn {
  background: rgba(15, 23, 42, 0.82);
  color: #e5e7eb;
  border-color: #334155;
}
html.dark-mode .cancel-btn:hover {
  background: #1e293b;
  border-color: #475569;
}
html.dark-mode .requests-empty {
  background: #18181b;
  border-color: #27272a;
  color: #94a3b8;
}
</style>