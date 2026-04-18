<template>
  <Settings
    :userId="userId"
    @close="goBack"
    @profile-updated="onProfileUpdated"
    @dark-mode-changed="onDarkModeChanged"
  />
</template>

<script>
import Settings from "../components/Settings.vue";

export default {
  components: { Settings },
  computed: {
    userId() {
      return localStorage.getItem("userId");
    }
  },
  mounted() {
    if (!this.userId) {
      this.$router.replace("/login");
    }
  },
  methods: {
    goBack() {
      this.$router.push("/main");
    },
    onProfileUpdated() {
      // Profile data is persisted on backend; Main reloads it after navigation.
    },
    onDarkModeChanged() {
      // Dark mode preference is already persisted in localStorage by Settings component.
    }
  }
};
</script>
