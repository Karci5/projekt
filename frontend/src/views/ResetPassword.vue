<template>
  <div class="auth-page">
    <div class="auth-shell">
      <div class="auth-visual" aria-hidden="true">
        <div ref="heroAnimation" class="hero-animation"></div>
      </div>

      <div class="login-container">
        <h2>Obnoviť heslo</h2>
        
        <div v-if="!tokenValid && !loading" class="error-message">
          <p>Odkaz na obnovenie hesla je neplatný alebo nepravidelný.</p>
          <p>Prosím, požiadaj o nový odkaz:</p>
          <button @click="goToForgotPassword" class="link-btn" style="display: inline-block; margin-top: 10px;">
            Späť na prihlasovanie
          </button>
        </div>

        <form v-else-if="tokenValid && !resetSuccess" @submit.prevent="resetPassword" class="login-form">
          <p class="form-subtitle">Zadaj nové heslo</p>
          <input 
            v-model="newPassword" 
            type="password" 
            placeholder="Nové heslo" 
            required 
            minlength="6"
          />
          <input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="Potvrď heslo" 
            required 
            minlength="6"
          />
          <div v-if="message" :class="['message', message.isError ? 'error' : 'success']">
            {{ message.text }}
          </div>
          <button type="submit" class="login-btn" :disabled="loading">
            {{ loading ? 'Zmena hesla...' : 'Zmeniť heslo' }}
          </button>
        </form>

        <div v-if="resetSuccess" class="success-box">
          <h3>✓ Heslo zmenené!</h3>
          <p>Tvoje heslo bolo úspešne zmenené. Teraz sa môžeš prihlásiť novou heslom.</p>
          <button @click="goToLogin" class="link-btn" style="display: inline-block; margin-top: 15px;">
            Prejsť na prihlasovanie
          </button>
        </div>

        <div v-if="loading" class="loading-box">
          <p>Overujem odkaz...</p>
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
      newPassword: "",
      confirmPassword: "",
      message: null,
      loading: false,
      tokenValid: false,
      resetSuccess: false,
      token: null,
      animationInstance: null,
    };
  },
  methods: {
    apiUrl(path) {
      return buildApiUrl(path);
    },
    goToLogin() {
      this.$router.push("/login");
    },
    goToForgotPassword() {
      this.$router.push("/login");
    },
    async validateToken() {
      const params = new URLSearchParams(window.location.search);
      this.token = params.get("token");

      if (!this.token) {
        this.tokenValid = false;
        this.loading = false;
        return;
      }

      // Pre teraz, berieme token ako platný ak existuje
      // Skutočná validácia sa uskutoční pri resetovaní
      this.tokenValid = true;
      this.loading = false;
    },
    mountHeroAnimation() {
      if (this.$refs.heroAnimation && !this.animationInstance) {
        try {
          this.animationInstance = lottie.loadAnimation({
            container: this.$refs.heroAnimation,
            renderer: "svg",
            loop: true,
            autoplay: true,
            path: "/Business%20team.json",
          });
        } catch (e) {
          console.error("Chyba pri načítavaní animácie:", e);
        }
      }
    },
    async resetPassword() {
      if (this.newPassword !== this.confirmPassword) {
        this.message = { text: "Heslá sa nezhodujú", isError: true };
        return;
      }

      if (this.newPassword.length < 6) {
        this.message = { text: "Heslo musí mať aspoň 6 znakov", isError: true };
        return;
      }

      if (!this.token) {
        this.message = { text: "Token chýba", isError: true };
        return;
      }

      this.loading = true;
      try {
        const res = await fetch(this.apiUrl("/api/auth/reset-password"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: this.token,
            newPassword: this.newPassword,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          this.resetSuccess = true;
          this.message = { text: "Heslo bolo úspešne zmenené!", isError: false };
          setTimeout(() => {
            this.goToLogin();
          }, 3000);
        } else {
          this.message = { 
            text: data.error || "Chyba pri zmene hesla. Skús to neskôr.", 
            isError: true 
          };
        }
      } catch (error) {
        this.message = { 
          text: "Chyba pri spojení. Skús to neskôr.", 
          isError: true 
        };
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.loading = true;
    this.validateToken();
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
.auth-page {
  display: flex;
  min-height: 100vh;
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

.form-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  font-weight: 500;
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
  margin-top: 0.5rem;
}

.login-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.login-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.error-message {
  background: #fee2e2;
  border: 1px solid #dc2626;
  border-radius: 10px;
  padding: 20px;
  color: #991b1b;
}

.error-message p {
  margin: 10px 0;
  font-size: 0.95rem;
}

.success-box {
  background: #ecfdf5;
  border: 1px solid #10b981;
  border-radius: 10px;
  padding: 20px;
  color: #065f46;
}

.success-box h3 {
  margin-top: 0;
  font-size: 1.2rem;
}

.success-box p {
  margin: 10px 0;
  font-size: 0.95rem;
}

.loading-box {
  color: #6b7280;
  font-size: 0.95rem;
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

@media (max-width: 1024px) {
  .auth-page {
    align-items: flex-start;
    padding: 16px 0 22px;
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
    margin: 0 14px;
  }
}

@media (max-width: 768px) {
  .auth-page {
    min-height: 100svh;
    align-items: flex-start;
    padding: 12px 0 18px;
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
    padding: 20px 14px 22px;
    border-radius: 14px;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
    max-width: 560px;
    margin: 0 10px;
  }

  .login-form input {
    font-size: 16px;
  }
}

@media (max-width: 420px) {
  .login-container {
    padding: 20px 14px 24px;
  }

  h2 {
    font-size: 1.35rem;
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

html.dark-mode .form-subtitle {
  color: #9ca3af;
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

html.dark-mode .login-btn:hover:not(:disabled) {
  background-color: #3b82f6;
}

html.dark-mode .message.error {
  background: #7f1d1d;
  border-left-color: #f87171;
  color: #fecaca;
}

html.dark-mode .message.success {
  background: #064e3b;
  border-left-color: #6ee7b7;
  color: #a7f3d0;
}

html.dark-mode .error-message {
  background: #7f1d1d;
  border-color: #f87171;
  color: #fecaca;
}

html.dark-mode .success-box {
  background: #064e3b;
  border-color: #6ee7b7;
  color: #a7f3d0;
}

html.dark-mode .loading-box {
  color: #9ca3af;
}

html.dark-mode .link-btn {
  color: #60a5fa;
}

html.dark-mode .link-btn:hover {
  color: #93c5fd;
}
</style>
