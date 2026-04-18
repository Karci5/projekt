<template>
  <div>
    <FriendItem
      v-for="f in friends"
      :key="f.id"
      :friend="f"
      :showAdd="showAdd"
      :isFriend="isFriend(f)"
      :nicknames="nicknames"
      :notes="notes"
      :show-options="showOptions"
      :is-pinned="isPinned(f)"
      :is-muted="isMuted(f)"
      :is-blocked="isBlocked(f)"
      :show-presence="showPresence"
      :friend-presence="presenceById[String(f.id)] || null"
      @select="$emit('select', $event)"
      @add="$emit('add', $event)"
      @remove-friend="$emit('remove-friend', $event)"
      @toggle-pin="$emit('toggle-pin', $event)"
      @toggle-mute="$emit('toggle-mute', $event)"
      @toggle-block="$emit('toggle-block', $event)"
      @view-profile="$emit('view-profile', $event)"
      @edit-note="$emit('edit-note', $event)"
      @write-message="$emit('write-message', $event)"
    />
  </div>
</template>

<script>
import FriendItem from './FriendItem.vue'
export default {
  props: {
    friends: { type: Array, default: () => [] },
    showAdd: { type: Boolean, default: false },
    friendIds: { type: Array, default: () => [] },
    nicknames: { type: Object, default: () => ({}) },
    notes: { type: Object, default: () => ({}) },
    pinnedIds: { type: Array, default: () => [] },
    mutedIds: { type: Array, default: () => [] },
    blockedIds: { type: Array, default: () => [] },
    presenceById: { type: Object, default: () => ({}) },
    showOptions: { type: Boolean, default: false },
    showPresence: { type: Boolean, default: false }
  },
  components: { FriendItem },
  methods: {
    isFriend(f) {
      // compare as strings to avoid type mismatch (number vs string)
      const id = String(f.id)
      return this.friendIds.map(String).includes(id)
    },
    isPinned(f) {
      return this.pinnedIds.map(String).includes(String(f.id));
    },
    isMuted(f) {
      return this.mutedIds.map(String).includes(String(f.id));
    },
    isBlocked(f) {
      return this.blockedIds.map(String).includes(String(f.id));
    }
  }
};
</script>
