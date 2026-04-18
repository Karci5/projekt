<template>
  <div class="auth-page">
    <div class="auth-shell">
      <div class="auth-visual" aria-hidden="true">
        <div ref="heroAnimation" class="hero-animation"></div>
      </div>

      <div class="login-container">
        <h2>Prihlásenie</h2>
        <form @submit.prevent="login" class="login-form">
          <input v-model="email" type="email" placeholder="Email" required />
          <input v-model="password" type="password" placeholder="Heslo" required />
          <div v-if="message" :class="['message', message.isError ? 'error' : 'success']">
            {{ message.text }}
          </div>
          <button type="submit" class="login-btn">Prihlásiť sa</button>
          <div class="forgot-password-link">
            <button type="button" @click="openForgotPasswordModal" class="link-btn">
              Zabudli ste heslo?
            </button>
          </div>
        </form>
        <button @click="loginWithGoogle" class="google-btn">
          <svg class="google-icon" viewBox="0 0 16 16" aria-hidden="true"><g clip-path="url(#clip0_643_9687)">
    <path d="M8.00018 3.16667C9.18018 3.16667 10.2368 3.57333 11.0702 4.36667L13.3535 2.08333C11.9668 0.793333 10.1568 0 8.00018 0C4.87352 0 2.17018 1.79333 0.853516 4.40667L3.51352 6.47C4.14352 4.57333 5.91352 3.16667 8.00018 3.16667Z" fill="#EA4335"></path>
    <path d="M15.66 8.18335C15.66 7.66002 15.61 7.15335 15.5333 6.66669H8V9.67335H12.3133C12.12 10.66 11.56 11.5 10.72 12.0667L13.2967 14.0667C14.8 12.6734 15.66 10.6134 15.66 8.18335Z" fill="#4285F4"></path>
    <path d="M3.51 9.53001C3.35 9.04668 3.25667 8.53334 3.25667 8.00001C3.25667 7.46668 3.34667 6.95334 3.51 6.47001L0.85 4.40668C0.306667 5.48668 0 6.70668 0 8.00001C0 9.29334 0.306667 10.5133 0.853333 11.5933L3.51 9.53001Z" fill="#FBBC05"></path>
    <path d="M8.0001 16C10.1601 16 11.9768 15.29 13.2968 14.0633L10.7201 12.0633C10.0034 12.5467 9.0801 12.83 8.0001 12.83C5.91343 12.83 4.14343 11.4233 3.5101 9.52667L0.850098 11.59C2.1701 14.2067 4.87343 16 8.0001 16Z" fill="#34A853"></path>
  </g> 
  </svg>
          Prihlásiť sa cez Google účet
        </button>

        <div class="register-section">
          <p>Nemáš účet?</p>
          <button @click="$router.push('/register')" class="register-btn">
            Zaregistruj sa
          </button>
        </div>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div v-if="showForgotPasswordModal" class="modal-overlay" @click="closeForgotPasswordModal">
      <div class="modal-box" @click.stop>
        <button class="modal-close" @click="closeForgotPasswordModal" aria-label="Zavrieť">✕</button>
        <h3>Obnoviť heslo</h3>
        <p class="modal-subtitle">Zadaj email, ktorý si použil pri registrácii. Na inú adresu sa odkaz nepošle.</p>
        
        <div class="reset-form">
          <input 
            v-model="resetEmail" 
            type="email" 
            placeholder="Tvoj email" 
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            @keyup.enter="requestPasswordReset"
          />
          <div v-if="resetMessage" :class="['message', resetMessage.isError ? 'error' : 'success']">
            {{ resetMessage.text }}
          </div>
          <button @click="requestPasswordReset" class="reset-btn" :disabled="resetLoading">
            {{ resetLoading ? 'Posielam...' : 'Poslať odkaz' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import lottie from "lottie-web";
import { apiUrl as buildApiUrl } from "../utils/backendUrl";

export default {
  data() {
    return {
      email: "",
      password: "",
      message: null,
      animationInstance: null,
      showForgotPasswordModal: false,
      resetEmail: "",
      resetMessage: null,
      resetLoading: false,
    };
  },
  methods: {
    apiUrl(path) {
      return buildApiUrl(path);
    },
    parseJwtPayload(token) {
      try {
        const parts = String(token || '').split('.');
        if (parts.length < 2) return null;
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
        return JSON.parse(atob(padded));
      } catch (e) {
        return null;
      }
    },
    persistAuth(token, user) {
      if (!token) return false;

      const decoded = this.parseJwtPayload(token) || {};
      const resolvedUserId = user?.id ?? decoded.id ?? null;
      const resolvedUsername = user?.username ?? decoded.username ?? null;

      localStorage.setItem('token', token);
      if (resolvedUserId !== null && resolvedUserId !== undefined) {
        localStorage.setItem('userId', String(resolvedUserId));
      }
      if (resolvedUsername) {
        localStorage.setItem('username', String(resolvedUsername));
      }
      return true;
    },
    async login() {
      try {
        const res = await fetch(this.apiUrl('/api/auth/login'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.email, password: this.password }),
        });
        const data = await res.json();

        if (data.token && this.persistAuth(data.token, data.user)) {
          this.message = { text: 'Úspešne prihlásený!', isError: false };
          this.$router.push("/main");
        } else if (data.error) {
          let errorText = data.error;
          // Preloženie backend chýb na SK
          if (errorText.includes('Uzivatel nenajdeny')) {
            errorText = 'Email neexistuje. Skús sa zaregistrovať.';
          } else if (errorText.includes('Neplatne heslo')) {
            errorText = 'Nesprávne heslo. Skús to znova.';
          } else if (errorText.includes('Email nie je overený')) {
            errorText = 'Email ešte nie je potvrdený. Skontroluj svoju poštu.';
          } else if (errorText.includes('Vsetky polia su povinne')) {
            errorText = 'Email a heslo sú povinné.';
          }
          this.message = { text: errorText, isError: true };
        } else {
          this.message = { text: 'Chyba pri prihlasovaní. Skús to znova.', isError: true };
        }
      } catch (err) {
        this.message = { text: 'Chyba servera. Skús to neskôr.', isError: true };
      }
    },
    loginWithGoogle() {
      console.log("Google URL:", this.apiUrl('/api/auth/google/redirect'));
      window.location.href = this.apiUrl('/api/auth/google/redirect');
    },
    mountHeroAnimation() {
      if (!this.$refs.heroAnimation) return;

      this.animationInstance = lottie.loadAnimation({
        container: this.$refs.heroAnimation,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/Business%20team.json",
      });
    },
    openForgotPasswordModal() {
      this.resetMessage = null;
      this.resetEmail = "";
      this.showForgotPasswordModal = true;
    },
    closeForgotPasswordModal() {
      this.showForgotPasswordModal = false;
      this.resetLoading = false;
      this.resetMessage = null;
      this.resetEmail = "";
    },
    async requestPasswordReset() {
      const normalizedEmail = String(this.resetEmail || "").trim().toLowerCase();
      this.resetEmail = normalizedEmail;

      if (!normalizedEmail) {
        this.resetMessage = { text: 'Zadaj prosím email.', isError: true };
        return;
      }

      this.resetLoading = true;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(this.apiUrl('/api/auth/forgot-password'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
          signal: controller.signal,
        });
        const data = await res.json();

        if (res.ok) {
          this.closeForgotPasswordModal();
        } else {
          let errorText = data.error || 'Chyba pri požiadavke. Skús to neskôr.';
          if (res.status === 404) {
            errorText = 'K tomuto emailu sme nenašli účet. Skontroluj adresu alebo sa zaregistruj.';
          } else if (data.detail) {
            errorText = `${errorText}: ${data.detail}`;
          }
          this.resetMessage = {
            text: errorText,
            isError: true
          };
        }
      } catch (error) {
        const isTimeout = error && error.name === 'AbortError';
        this.resetMessage = {
          text: isTimeout ? 'Server neodpovedá. Skús to znova o chvíľu.' : 'Chyba pri spojení. Skús to neskôr.',
          isError: true
        };
      } finally {
        clearTimeout(timeoutId);
        this.resetLoading = false;
      }
    },
  },
  mounted() {
    // Google OAuth token handler
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('userId');
    const username = params.get('username');
    const oauthError = params.get('error');
    const verified = params.get('verified');

    const verificationErrors = {
      invalid_verification_link: 'Verifikačný odkaz je neplatný.',
      verification_expired: 'Verifikačný odkaz expiroval. Požiadaj o nový.',
      verification_failed: 'Overenie emailu zlyhalo. Skús to znova.'
    };

    const googleErrors = {
      google_auth_failed: 'Google prihlásenie zlyhalo. Skús to znova.',
      google_oauth_error: 'Google OAuth chyba. Skontroluj nastavenie callback URL.',
      google_token_error: 'Nepodarilo sa vytvoriť prihlasovací token. Skús to znova.'
    };

    if (verified === '1') {
      this.message = { text: 'Email bol úspešne overený. Môžeš sa prihlásiť.', isError: false };
    } else if (oauthError && verificationErrors[oauthError]) {
      this.message = { text: verificationErrors[oauthError], isError: true };
    }

    if (oauthError && googleErrors[oauthError]) {
      this.message = { text: googleErrors[oauthError], isError: true };
    }

    if (token) {
      const user = {
        id: userId ? Number(userId) : undefined,
        username: username || undefined
      };
      if (this.persistAuth(token, user)) {
        this.$router.push('/main');
      } else {
        this.message = { text: 'Nepodarilo sa dokončiť Google prihlásenie.', isError: true };
      }
    }

    this.mountHeroAnimation();
  },
  beforeUnmount() {
    if (this.animationInstance) {
      this.animationInstance.destroy();
      this.animationInstance = null;
    }
  },
};
</script>

<style scoped>
.google-btn {
  width: 100%;
  margin-top: 0.75rem;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.72rem 0.95rem;
  background: #fff;
  color: #4285F4;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: background-color 0.2s, border-color 0.2s, transform 0.15s;
}

.message {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 16px;
  font-weight: 500;
}

.message.error {
  background: #fee2e2;
  border-left: 3px solid #dc2626;
  color: #991b1b;
}

.message.success {
  background: #ecfdf5;
  border-left: 3px solid #10b981;
  color: #065f46;
}
.google-btn:hover {
  background: #f1f5f9;
  border-color: #4285F4;
}
.google-btn:active {
  transform: translateY(1px);
}

.google-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  display: block;
  flex-shrink: 0;
}

.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 2.8vw, 32px);
  background: radial-gradient(circle at 20% 10%, #eef6ff 0%, #f5f7fb 38%, #eef2ff 100%);
  overflow-x: hidden;
}

.auth-shell {
  width: 100%;
  max-width: 1120px;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 420px);
  gap: clamp(16px, 2.2vw, 26px);
  align-items: stretch;
}

.auth-visual {
  background: #eaf3ff;
  border-radius: 24px;
  padding: clamp(12px, 1.8vw, 20px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  min-height: clamp(380px, 52vh, 560px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-animation {
  width: 100%;
  height: 100%;
  min-height: clamp(320px, 45vh, 500px);
}

.login-container {
  width: 100%;
  max-width: 420px;
  justify-self: end;
  padding: clamp(22px, 2.8vw, 36px) clamp(18px, 2.4vw, 32px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  background: #ffffff;
  text-align: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  box-sizing: border-box;
}

h2 {
  margin-bottom: 1rem;
  color: #0f172a;
  font-weight: 700;
  font-size: clamp(1.5rem, 1.1rem + 0.8vw, 1.75rem);
}

.login-form input {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  display: block;
  padding: 0.78rem 0.88rem;
  margin-bottom: 0.72rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #f9fafb;
  box-sizing: border-box;
}

.login-form input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.login-btn {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  display: block;
  padding: 0.8rem 0.9rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.2s, transform 0.15s;
}

.login-btn:hover {
  background-color: #1d4ed8;
}
.login-btn:active {
  transform: translateY(1px);
}

.register-section {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #6b7280;
  gap: 0.3rem;
}

.register-btn {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  display: block;
  margin-top: 0.25rem;
  padding: 0.68rem 0.9rem;
  background: #ffffff;
  color: #2563eb;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 600;
  transition: background-color 0.2s, border-color 0.2s, transform 0.15s;
}

.register-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}
.register-btn:active {
  transform: translateY(1px);
}

.message {
  width: 100%;
  margin: -0.2rem auto 0.65rem;
  color: #dc2626;
  font-weight: 600;
  font-size: 0.82rem;
  text-align: left;
}

@media (max-width: 1024px) {
  .auth-page {
    align-items: flex-start;
    padding: 16px 12px 22px;
    background: #ffffff;
  }

  .auth-shell {
    grid-template-columns: 1fr;
    max-width: 760px;
    display: block;
  }

  .auth-visual {
    display: none;
  }

  .login-container {
    max-width: 620px;
    justify-self: center;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .auth-page {
    min-height: 100svh;
    align-items: flex-start;
    padding: max(12px, env(safe-area-inset-top)) 10px calc(18px + env(safe-area-inset-bottom));
    background: #ffffff;
  }

  .auth-shell {
    max-width: 100%;
    display: block;
  }

  .auth-visual {
    display: none;
  }

  .login-container {
    width: min(100%, 520px);
    padding: 18px 12px 20px;
    border-radius: 14px;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
    max-width: 520px;
    margin: 0 auto;
  }

  .login-form input {
    font-size: 16px;
    margin-bottom: 0.62rem;
  }

  .login-btn,
  .google-btn,
  .register-btn {
    min-height: 50px;
  }

  .google-btn {
    padding: 0.72rem 0.75rem;
    font-size: 0.98rem;
    white-space: normal;
    line-height: 1.3;
    gap: 8px;
  }

  .register-section {
    margin-top: 0.85rem;
  }
}

@media (max-width: 420px) {
  .login-container {
    width: 100%;
    border-radius: 12px;
    padding: 16px 10px 18px;
  }

  h2 {
    font-size: 1.28rem;
    margin-bottom: 0.8rem;
  }

  .forgot-password-link {
    margin-top: 0.85rem;
    padding-top: 0.45rem;
  }
}

/* ===== DARK MODE ===== */
html.dark-mode .auth-page {
  background: #000000;
}

html.dark-mode .auth-visual {
  background: #0b0b0b;
  border: 1px solid #1f2937;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

html.dark-mode .login-container {
  background: #0b0b0b;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

html.dark-mode h2 {
  color: #e5e7eb;
}

html.dark-mode .login-form input {
  background: #111111;
  border-color: #1f2937;
  color: #e5e7eb;
}

html.dark-mode .login-form input::placeholder {
  color: #6b7280;
}

html.dark-mode .login-form input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
}

html.dark-mode .login-btn {
  background: #2563eb;
}

html.dark-mode .login-btn:hover {
  background-color: #3b82f6;
}

html.dark-mode .register-section {
  color: #9ca3af;
}

html.dark-mode .register-btn {
  background: #111111;
  color: #60a5fa;
  border-color: #1f2937;
}

html.dark-mode .register-btn:hover {
  background: #1a1a1a;
  border-color: #374151;
}

html.dark-mode .message {
  color: #f87171;
}

@media (max-width: 768px) {
  html.dark-mode .auth-page {
    background: #000000;
  }
  html.dark-mode .login-container {
    box-shadow: none;
  }
}

/* ===== FORGOT PASSWORD MODAL ===== */
.forgot-password-link {
  margin-top: 1rem;
  text-align: center;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.link-btn {
  background: none;
  border: none;
  color: #2563eb;
  text-decoration: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s, text-decoration 0.2s;
  padding: 0.25rem 0.5rem;
}

.link-btn:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  border-radius: 16px;
  padding: 28px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.2s;
  padding: 4px 8px;
}

.modal-close:hover {
  color: #374151;
}

.modal-box h3 {
  margin: 0 0 0.5rem;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 700;
}

.modal-subtitle {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0 0 1.5rem;
  line-height: 1.5;
}


.reset-form input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  box-sizing: border-box;
  background: #f9fafb;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.reset-form input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.reset-btn {
  width: 100%;
  padding: 0.8rem 0.9rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: background-color 0.2s, transform 0.15s;
  margin-top: 0.5rem;
}

.reset-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.reset-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.reset-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

html.dark-mode .modal-overlay {
  background: rgba(0, 0, 0, 0.7);
}

html.dark-mode .modal-box {
  background: #0b0b0b;
}

html.dark-mode .modal-close {
  color: #6b7280;
}

html.dark-mode .modal-close:hover {
  color: #e5e7eb;
}

html.dark-mode .modal-box h3 {
  color: #e5e7eb;
}

html.dark-mode .modal-subtitle {
  color: #9ca3af;
}

html.dark-mode .reset-form input {
  background: #111111;
  border-color: #1f2937;
  color: #e5e7eb;
}

html.dark-mode .reset-form input::placeholder {
  color: #6b7280;
}

html.dark-mode .reset-form input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
}

html.dark-mode .forgot-password-link {
  border-top-color: #1f2937;
}

html.dark-mode .link-btn {
  color: #60a5fa;
}

html.dark-mode .link-btn:hover {
  color: #93c5fd;
}
</style>
