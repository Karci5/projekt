import { createRouter, createWebHistory } from "vue-router";
import Login from "../components/Login.vue";
import Register from "../components/Register.vue";
import Main from "../views/Main.vue";
import SettingsPage from "../views/SettingsPage.vue";
import ResetPassword from "../views/ResetPassword.vue";

const routes = [
  { path: "/", redirect: "/login" },   
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/reset-password", component: ResetPassword },
  { path: "/main", component: Main },
  { path: "/settings", component: SettingsPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Restore deep-link path saved by 404.html/route fallback pages before any redirect fires
router.beforeEach((to) => {
  const pendingRedirect = sessionStorage.getItem('spa_redirect_path');
  if (pendingRedirect) {
    sessionStorage.removeItem('spa_redirect_path');
    if (to.path !== pendingRedirect) {
      return pendingRedirect;
    }
  }
});

export default router;
