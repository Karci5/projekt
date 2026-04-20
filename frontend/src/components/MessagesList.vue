<template>
  <div class="messages" ref="list" @scroll="onScroll">
    <MessageItem
      v-for="(m, i) in messages"
      :key="m.id || m.created_at"
      :message="m"
      :show-sender-name="showSenderName"
      :show-avatar="shouldShowAvatar(i)"
      :users="users"
      :open-menu-id="openMenuId"
      @edit="$emit('edit', m)"
      @delete="$emit('delete', m)"
      @open-menu="setOpenMenu"
      @reply="$emit('reply', m)"
    />
  </div>
</template>

<script>
import MessageItem from './MessageItem.vue'
export default {
  props: {
    messages: { type: Array, default: () => [] },
    showSenderName: { type: Boolean, default: false },
    users: { type: Object, default: null }
  },
  emits: ['edit', 'delete', 'reply'],
  components: { MessageItem },
  beforeUpdate() {
    const el = this.$refs.list;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    const threshold = 100; // px

    const newLength = this.messages.length;
    const added = newLength - this.prevMessagesLength;

    // update shouldScrollToBottom based on current position
    this.shouldScrollToBottom = distanceFromBottom < threshold;

    if (added > 0 && !this.shouldScrollToBottom) {
      this.newMessagesCount += added;
    }
  },
  watch: {
    messages: {
      handler(newVal) {
        // Scrolluj dolu len keď je v messages aspoň jedna správa
        if (Array.isArray(newVal) && newVal.length > 0) {
          this.$nextTick(() => {
            this.scrollToBottom(true);
            this.newMessagesCount = 0;
          });
        }
        this.prevMessagesLength = newVal.length;
      },
      immediate: true
    }
  },
  methods: {
    shouldShowAvatar(idx) {
      const m = this.messages[idx];
      // Avatar len pri správach iných používateľov
      return m && !m.mine;
    },
    setOpenMenu(id) {
      this.openMenuId = id;
    },
  },
  scrollToBottom(animate = true) {
    const el = this.$refs.list;
    if (!el) return;
    if (animate && el.scrollTo) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  },
  onScroll() {
    const el = this.$refs.list;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    const threshold = 100;
    if (distanceFromBottom < threshold) this.newMessagesCount = 0;
  },
  jumpToLatest() {
    this.scrollToBottom(true);
    this.newMessagesCount = 0;
  }
  }
</script>

<style scoped>
.messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 1.5vw, 10px);
  padding: clamp(10px, 2.5vw, 20px);
  padding-bottom: 90px; /* reserve space for the anchored input */
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  min-height: 0;
  background: var(--chat-bg, #f0f2f5);
}

.new-msg-btn {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 10;
  background: #1877f2;
  color: #fff;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-size: 13px;
}

/* ===== DARK MODE ===== */
html.dark-mode .new-msg-btn {
  background: #2563eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}
</style>