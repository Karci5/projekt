<!-- @charset "UTF-8" -->
<template>
  <div class="auth-page">
    <div class="auth-shell">
      <div class="auth-visual" aria-hidden="true">
        <div ref="heroAnimation" class="hero-animation"></div>
      </div>

      <div class="register-container">
        <div v-if="!showVerification" class="step-1">
          <h2>Registrácia</h2>
          <form @submit.prevent="register" class="register-form">
            <input v-model="meno" placeholder="Meno" required />
            <input v-model="email" type="email" placeholder="Email" required />
            <input v-model="password" type="password" placeholder="Heslo" required />
            <input
              v-model="passwordConfirm"
              type="password"
              placeholder="Potvrď heslo"
              required
            />
            <button type="submit" class="register-btn">Ďalej</button>
          </form>

          <div class="login-section">
            <p>Už máš účet?</p>
            <button @click="$router.push('/login')" class="login-btn">Prihlás sa</button>
          </div>

          <p v-if="message" :class="['message', messageType]">{{ message }}</p>
        </div>

        <div v-else class="step-2">
          <h2>Potvrd email</h2>
          <p class="info-text">Poslali sme ti verifikacny kod aj potvrzovaci odkaz na: <strong>{{ email }}</strong></p>

          <form @submit.prevent="verifyEmail" class="verify-form">
            <input
              v-model="verificationCode"
              placeholder="Zadaj 6-znakovy kod"
              maxlength="6"
              required
            />
            <button type="submit" class="verify-btn">Potvrd</button>
          </form>

          <button @click="resendCode" class="resend-btn" :disabled="resendCooldown > 0">
            {{ resendCooldown > 0 ? `Opatovny kod za ${resendCooldown}s` : "Poslat kod znova" }}
          </button>

          <p v-if="message" :class="['message', messageType]">{{ message }}</p>
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
      meno: "",
      email: "",
      password: "",
      passwordConfirm: "",
      message: "",
      messageType: "error",
      showVerification: false,
      verificationCode: "",
      userId: null,
      resendCooldown: 0,
      animationInstance: null,
    };
  },
  methods: {
    apiUrl(path) {
      return buildApiUrl(path);
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

    async register() {

      // Kontrola mena a emailu
      if (!this.meno || this.meno.trim().length === 0 || !this.email || this.email.trim().length === 0) {
        this.message = "Vsetky polia su povinne a nesmu byt prazdne";
        this.messageType = "error";
        return;
      }

      if (this.password !== this.passwordConfirm) {
        this.message = "Hesla sa nezhoduju";
        this.messageType = "error";
        return;
      }

      if (this.password.length < 6) {
        this.message = "Heslo musi byt aspon 6 znakov";
        this.messageType = "error";
        return;
      }

      try {
        const res = await fetch(this.apiUrl('/api/auth/register'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: this.meno,
            email: this.email,
            password: this.password,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          this.userId = data.userId;
          this.showVerification = true;
          this.message = "Kod a potvrzovaci odkaz boli poslane na email";
          this.messageType = "success";
        } else {
          this.message = data.error || "Chyba pri registracii";
          this.messageType = "error";
        }
      } catch (err) {
        this.message = "Chyba servera";
        this.messageType = "error";
      }
    },

    async verifyEmail() {
      if (this.verificationCode.length !== 6) {
        this.message = "Kod musi byt 6 znakov";
        this.messageType = "error";
        return;
      }

      try {
        const res = await fetch(this.apiUrl('/api/auth/verify-email'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: this.userId,
            verificationCode: this.verificationCode,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          this.message = "Email overeny! Presmerovavam...";
          this.messageType = "success";

          localStorage.setItem("token", data.token);
          localStorage.setItem("userId", data.user.id);
          localStorage.setItem("meno", data.user.meno);

          setTimeout(() => {
            this.$router.push("/");
          }, 1000);
        } else {
          this.message = data.error || "Neplatny kod";
          this.messageType = "error";
        }
      } catch (err) {
        this.message = "Chyba servera";
        this.messageType = "error";
      }
    },

    async resendCode() {
      try {
        const res = await fetch(this.apiUrl('/api/auth/resend-verification'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: this.userId,
            email: this.email,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          this.message = "Novy kod a potvrzovaci odkaz boli poslane na email";
          this.messageType = "success";

          this.resendCooldown = 60;
          const timer = setInterval(() => {
            this.resendCooldown--;
            if (this.resendCooldown <= 0) clearInterval(timer);
          }, 1000);
        } else {
          this.message = data.error || "Chyba pri posielani kodu";
          this.messageType = "error";
        }
      } catch (err) {
        this.message = "Chyba servera";
        this.messageType = "error";
      }
    },
  },
  mounted() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      this.$router.push("/");
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
  padding: clamp(18px, 2.2vw, 28px);
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

.register-container {
  width: 100%;
  max-width: 420px;
  margin: 0;
  justify-self: end;
  padding: clamp(22px, 2.8vw, 36px) clamp(18px, 2.4vw, 32px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  background: #ffffff;
  text-align: center;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  box-sizing: border-box;
}

h2 {
  margin-bottom: 1rem;
  color: #0f172a;
  font-weight: 700;
  font-size: clamp(1.5rem, 1.1rem + 0.8vw, 1.75rem);
}

.info-text {
  color: #6b7280;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.info-text strong {
  color: #2563eb;
}

.register-form,
.verify-form {
  display: flex;
  flex-direction: column;
  gap: 0.72rem;
  margin-bottom: 1rem;
}

.register-form input,
.verify-form input {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  display: block;
  padding: 0.78rem 0.88rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  background: #f9fafb;
}

.register-form input:focus,
.verify-form input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.register-btn,
.verify-btn {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  display: block;
  padding: 0.8rem 0.9rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.2s, transform 0.15s;
}

.register-btn:hover,
.verify-btn:hover {
  background-color: #1d4ed8;
}

.register-btn:active,
.verify-btn:active {
  transform: translateY(1px);
}

.resend-btn {
  width: 100%;
  padding: 0.68rem 0.9rem;
  background-color: #f8fafc;
  color: #475569;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s, border-color 0.2s;
  margin-bottom: 0.9rem;
}

.resend-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}

.resend-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.login-section {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #6b7280;
  gap: 0.3rem;
}

.login-btn {
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

.login-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.login-btn:active {
  transform: translateY(1px);
}

.message {
  margin-top: 0.8rem;
  padding: 0.62rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.88rem;
}

.message.error {
  color: #c62828;
  background-color: #ffebee;
  border: 1px solid #ef5350;
}

.message.success {
  color: #2e7d32;
  background-color: #e8f5e9;
  border: 1px solid #66bb6a;
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

  .register-container {
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

  .register-container {
    padding: 20px 14px 22px;
    border-radius: 14px;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
    max-width: 560px;
    margin: 0 10px;
  }

  .register-form input,
  .verify-form input {
    font-size: 16px;
  }
}

@media (max-width: 420px) {
  .register-container {
    padding: 20px 14px 24px;
  }

  h2 {
    font-size: 1.35rem;
  }
}

html.dark-mode .auth-page {
  background: #000000;
}

html.dark-mode .auth-visual {
  background: #0b0b0b;
  border: 1px solid #1f2937;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

html.dark-mode .register-container {
  background: #0b0b0b;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

html.dark-mode h2 {
  color: #e5e7eb;
}

html.dark-mode .info-text {
  color: #9ca3af;
}

html.dark-mode .info-text strong {
  color: #60a5fa;
}

html.dark-mode .register-form input,
html.dark-mode .verify-form input {
  background: #111111;
  border-color: #1f2937;
  color: #e5e7eb;
}

html.dark-mode .register-form input::placeholder,
html.dark-mode .verify-form input::placeholder {
  color: #6b7280;
}

html.dark-mode .register-form input:focus,
html.dark-mode .verify-form input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
}

html.dark-mode .register-btn,
html.dark-mode .verify-btn {
  background-color: #e5e7eb;
  color: #111827;
}

html.dark-mode .register-btn:hover,
html.dark-mode .verify-btn:hover {
  background-color: #d1d5db;
}

html.dark-mode .resend-btn {
  background-color: #111111;
  color: #9ca3af;
  border-color: #1f2937;
}

html.dark-mode .resend-btn:hover:not(:disabled) {
  background-color: #1a1a1a;
  border-color: #374151;
}

html.dark-mode .login-section {
  color: #9ca3af;
}

html.dark-mode .login-btn {
  background: #111111;
  color: #60a5fa;
  border-color: #1f2937;
}

html.dark-mode .login-btn:hover {
  background: #1a1a1a;
  border-color: #374151;
}

html.dark-mode .message.error {
  color: #f87171;
  background-color: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
}

html.dark-mode .message.success {
  color: #4ade80;
  background-color: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

@media (max-width: 768px) {
  html.dark-mode .auth-page {
    background: #000000;
  }

  html.dark-mode .register-container {
    box-shadow: none;
  }
}
</style>
