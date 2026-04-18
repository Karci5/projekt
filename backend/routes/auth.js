const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db"); // správne importovať pool priamo
const { sendVerificationEmail, sendPasswordResetEmail } = require("../mail");
require("dotenv").config();

const passport = require("../passport");

const router = express.Router();

function getBackendBaseUrl(req) {
  const explicit = String(
    process.env.BACKEND_URL ||
    process.env.API_BASE_URL ||
    ''
  ).replace(/\/$/, '');

  if (explicit) return explicit;

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host');
  return `${protocol}://${host}`;
}

function getFrontendBaseUrl() {
  return String(process.env.FRONTEND_URL || '').replace(/\/$/, '');
}

function getRuntimeBackendBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host');
  return `${protocol}://${host}`;
}

function getGoogleCallbackUrl(req) {
  return `${getRuntimeBackendBaseUrl(req)}/api/auth/google/callback`;
}

// Funkcia na generovanie 6-miestneho kódu
const generateVerificationCode = () => {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
};

// REGISTER - Step 1: Vytvorenie dočasného účtu a odoslanie kódu
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Vsetky polia su povinne" });
  }

  try {
    const [existing] = await db.execute(
      "SELECT id FROM chat_users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Uzivatel uz existuje" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Vytvoríme používateľa ako neoverený
    const [result] = await db.execute(
      "INSERT INTO chat_users (username, email, password, is_verified) VALUES (?, ?, ?, FALSE)",
      [username, email, hashedPassword]
    );

    const userId = result.insertId;

    // Generujeme verifikačný kód
    const verificationCode = generateVerificationCode();
    
    // Nastavíme expiráciu na 15 minút
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Uložíme kód do databázy
    await db.execute(
      "INSERT INTO email_verifications (user_id, verification_code, expires_at) VALUES (?, ?, ?)",
      [userId, verificationCode, expiresAt]
    );

    const backendBaseUrl = getBackendBaseUrl(req);
    const verificationLink = `${backendBaseUrl}/api/auth/verify-email-link?userId=${encodeURIComponent(String(userId))}&code=${encodeURIComponent(String(verificationCode))}`;

    // Odošleme email (kód + klikateľný link)
    const emailSent = await sendVerificationEmail(email, verificationCode, verificationLink);

    if (!emailSent) {
      return res.status(500).json({ error: "Chyba pri odosielaní emailu" });
    }

    res.json({ 
      message: "Účet vytvorený. Verifikačný kód bol poslaný na email.",
      userId: userId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// VERIFY EMAIL - Overenie kódu
router.post("/verify-email", async (req, res) => {
  const { userId, verificationCode } = req.body;
  if (!userId || !verificationCode) {
    return res.status(400).json({ error: "userId a verificationCode su povinne" });
  }

  try {
    // Hľadáme nepoužitý a čas platný kód
    const [verifications] = await db.execute(
      `SELECT id, user_id FROM email_verifications 
       WHERE user_id = ? AND verification_code = ? AND used = FALSE AND expires_at > UTC_TIMESTAMP()`,
      [userId, verificationCode]
    );

    if (verifications.length === 0) {
      return res.status(400).json({ error: "Neplatný alebo expirovaný kód" });
    }

    // Označíme kód ako použitý
    await db.execute(
      "UPDATE email_verifications SET used = TRUE WHERE id = ?",
      [verifications[0].id]
    );

    // Označíme používateľa ako overený
    await db.execute(
      "UPDATE chat_users SET is_verified = TRUE WHERE id = ?",
      [userId]
    );

    // Vygenerujeme JWT token
    const [users] = await db.execute(
      "SELECT id, username FROM chat_users WHERE id = ?",
      [userId]
    );

    const user = users[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Email overený! Vitaj v Chat App",
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// VERIFY EMAIL VIA LINK - klikateľné potvrdenie z emailu
router.get('/verify-email-link', async (req, res) => {
  const userId = String(req.query.userId || '').trim();
  const verificationCode = String(req.query.code || '').trim();
  const frontendUrl = getFrontendBaseUrl();

  if (!userId || !verificationCode) {
    if (!frontendUrl) return res.status(400).send('Invalid verification link');
    return res.redirect(`${frontendUrl}/login?error=invalid_verification_link`);
  }

  try {
    const [verifications] = await db.execute(
      `SELECT id, user_id FROM email_verifications
       WHERE user_id = ? AND verification_code = ? AND used = FALSE AND expires_at > UTC_TIMESTAMP()` ,
      [userId, verificationCode]
    );

    if (verifications.length === 0) {
      if (!frontendUrl) return res.status(400).send('Verification code invalid or expired');
      return res.redirect(`${frontendUrl}/login?error=verification_expired`);
    }

    await db.execute(
      'UPDATE email_verifications SET used = TRUE WHERE id = ?',
      [verifications[0].id]
    );

    await db.execute(
      'UPDATE chat_users SET is_verified = TRUE WHERE id = ?',
      [userId]
    );

    if (!frontendUrl) return res.send('Email verified successfully');
    return res.redirect(`${frontendUrl}/login?verified=1`);
  } catch (err) {
    console.error('verify-email-link error', err);
    if (!frontendUrl) return res.status(500).send('Server error');
    return res.redirect(`${frontendUrl}/login?error=verification_failed`);
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Vsetky polia su povinne" });
  }

  try {
    const [users] = await db.execute(
      "SELECT * FROM chat_users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "Uzivatel nenajdeny" });
    }

    const user = users[0];
    
    // Kontrolujeme či je email overený
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: "Email nie je overený. Prosím potvrď email pomocou kódu.",
        userId: user.id 
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(400).json({ error: "Neplatne heslo" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await db.execute(
      "UPDATE chat_users SET is_online = 1, last_active = NOW() WHERE id = ?",
      [user.id]
    );

    res.json({
      message: "Prihlaseny",
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// RESEND VERIFICATION CODE - Pre prípad že sa kód stratil
router.post("/resend-verification", async (req, res) => {
  const { userId, email } = req.body;
  if (!userId || !email) {
    return res.status(400).json({ error: "userId a email su povinne" });
  }

  try {
    // Zmaž staré nepoužité kódy
    await db.execute(
      "DELETE FROM email_verifications WHERE user_id = ? AND used = FALSE",
      [userId]
    );

    // Generuj nový kód
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.execute(
      "INSERT INTO email_verifications (user_id, verification_code, expires_at) VALUES (?, ?, ?)",
      [userId, verificationCode, expiresAt]
    );

    const backendBaseUrl = getBackendBaseUrl(req);
    const verificationLink = `${backendBaseUrl}/api/auth/verify-email-link?userId=${encodeURIComponent(String(userId))}&code=${encodeURIComponent(String(verificationCode))}`;

    // Odošli email (kód + klikateľný link)
    const emailSent = await sendVerificationEmail(email, verificationCode, verificationLink);

    if (!emailSent) {
      return res.status(500).json({ error: "Chyba pri odosielaní emailu" });
    }

    res.json({ message: "Nový verifikačný kód bol poslaný na email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// CHANGE PASSWORD (simple version)
router.post("/change-password", async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body || {};

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "Chybaju povinne udaje" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: "Nove heslo musi mat aspon 6 znakov" });
  }

  try {
    const [users] = await db.execute(
      "SELECT id, password FROM chat_users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Pouzivatel nenajdeny" });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({ error: "Aktualne heslo nie je spravne" });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ error: "Nove heslo nemoze byt rovnake ako aktualne" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute(
      "UPDATE chat_users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );

    res.json({ message: "Heslo bolo uspesne zmenene" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// LOGOUT
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(400).json({ error: 'Token chýba' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Neplatný token' });
    }

    await db.execute(
      "UPDATE chat_users SET is_online = 0, last_active = NOW() WHERE id = ?",
      [payload.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba servera' });
  }
});

// FORGOT PASSWORD - Generate reset token and send email
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email je povinný" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const [users] = await db.execute(
      "SELECT id FROM chat_users WHERE LOWER(email) = LOWER(?)",
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Tento email nie je registrovaný v aplikácii" });
    }

    const userId = users[0].id;

    // Vygenerujeme bezpečný token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hodina

    // Uložíme token do databázy
    await db.execute(
      "INSERT INTO password_resets (user_id, reset_token, expires_at) VALUES (?, ?, ?)",
      [userId, resetToken, expiresAt]
    );

    // Odošleme email
    const emailResult = await sendPasswordResetEmail(normalizedEmail, resetToken);

    if (!emailResult || !emailResult.success) {
      const reason = emailResult && emailResult.reason ? emailResult.reason : 'unknown';
      console.error('sendPasswordResetEmail failed, reason:', reason);
      return res.status(500).json({ error: "Chyba pri odosielaní emailu", detail: reason });
    }

    res.json({ message: "Odkaz na obnovenie hesla bol odoslaný" });
  } catch (err) {
    console.error('forgot-password route error:', err);
    res.status(500).json({ error: "Chyba servera", detail: err.message });
  }
});

// RESET PASSWORD - Validate token and update password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token a heslo sú povinné" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: "Heslo musí mať aspoň 6 znakov" });
  }

  try {
    // Hľadáme platný token (expires_at je v UTC, preto UTC_TIMESTAMP())
    const [resets] = await db.execute(
      `SELECT user_id FROM password_resets 
       WHERE reset_token = ? AND expires_at > UTC_TIMESTAMP() LIMIT 1`,
      [token]
    );

    if (resets.length === 0) {
      return res.status(400).json({ error: "Odkaz na obnovenie hesla je neplatný alebo expirovaný" });
    }

    const userId = resets[0].user_id;

    // Zašifrujeme nové heslo
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Aktualizujeme heslo
    await db.execute(
      "UPDATE chat_users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );

    // Zmaž všetky reset tokeny pre tohto používateľa
    await db.execute(
      "DELETE FROM password_resets WHERE user_id = ?",
      [userId]
    );

    res.json({ message: "Heslo bolo úspešne zmenené. Prihláste sa novým heslom." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// GOOGLE OAUTH REDIRECT
router.get("/google/redirect", (req, res, next) => {
  const callbackURL = getGoogleCallbackUrl(req);
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    session: false,
    callbackURL,
  })(req, res, next);
});

router.get("/google/failure", (req, res) => {
  const frontendUrl = String(process.env.FRONTEND_URL || '').replace(/\/$/, '');
  if (!frontendUrl) {
    return res.status(500).json({ error: "FRONTEND_URL nie je nastaveny" });
  }
  res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
});

// GOOGLE OAUTH CALLBACK
router.get("/google/callback", (req, res, next) => {
  // Some proxies/decoders can turn '+' into spaces inside OAuth code.
  if (typeof req.query.code === 'string' && req.query.code.includes(' ')) {
    req.query.code = req.query.code.replace(/ /g, '+');
  }

  const callbackURL = getGoogleCallbackUrl(req);

  passport.authenticate("google", { session: false, callbackURL }, (err, user) => {
    const frontendUrl = String(process.env.FRONTEND_URL || '').replace(/\/$/, '');

    if (!frontendUrl) {
      console.error('Google callback error: FRONTEND_URL missing');
      return res.status(500).json({ error: "FRONTEND_URL nie je nastaveny" });
    }

    if (err) {
      console.error('Google callback passport error:', {
        code: err && err.code,
        status: err && err.status,
        message: err && err.message,
        callbackURL,
      });
      return res.redirect(`${frontendUrl}/login?error=google_oauth_error`);
    }

    if (!user || !user.id) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    try {
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const username = encodeURIComponent(String(user.username || ""));
      const userId = encodeURIComponent(String(user.id || ""));
      return res.redirect(`${frontendUrl}/login?token=${token}&userId=${userId}&username=${username}`);
    } catch (tokenErr) {
      console.error('Google callback token error:', tokenErr);
      return res.redirect(`${frontendUrl}/login?error=google_token_error`);
    }
  })(req, res, next);
});

module.exports = router;
