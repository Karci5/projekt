
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const backendBaseUrl = String(process.env.BACKEND_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
const googleCallbackUrl = String(
  process.env.GOOGLE_CALLBACK_URL || `${backendBaseUrl}/api/auth/google/callback`
).trim();
const googleClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
const googleClientSecret = String(process.env.GOOGLE_CLIENT_SECRET || '').trim();

function getHighResGooglePhotoUrl(url) {
  if (!url || typeof url !== 'string') return url;

  // Typical Google avatar URL contains size token like ...=s96-c
  if (url.includes('googleusercontent.com')) {
    if (/=s\d+-c/.test(url)) {
      return url.replace(/=s\d+-c/, '=s512-c');
    }
    if (/=s\d+/.test(url)) {
      return url.replace(/=s\d+/, '=s512');
    }
    // fallback size hint
    return url.includes('?') ? `${url}&sz=512` : `${url}?sz=512`;
  }

  return url;
}

// Helper: download image from URL and save to frontend/public/uploads/profile_pictures, return local path
async function downloadGoogleProfilePic(url, googleId) {
  if (!url) return null;
  const ext = path.extname(url.split('?')[0]) || '.jpg';
  const filename = `profile_google_${googleId}_${Date.now()}${ext}`;
  const destDir = path.join(__dirname, '..', 'frontend', 'public', 'uploads', 'profile_pictures');
  try {
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  } catch (e) {
    return null;
  }
  const destPath = path.join(destDir, filename);
  const relPath = `/uploads/profile_pictures/${filename}`;
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    file.on('error', () => {
      fs.unlink(destPath, () => {});
      resolve(null);
    });
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return resolve(null);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(relPath));
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      resolve(null);
    });
  });
}

passport.use(new GoogleStrategy({
  clientID: googleClientId,
  clientSecret: googleClientSecret,
  callbackURL: googleCallbackUrl,
}, async (accessToken, refreshToken, profile, done) => {
  console.log('Google OAuth Debug:', {
    callbackURL: googleCallbackUrl,
    clientID: process.env.GOOGLE_CLIENT_ID ? '***' : 'MISSING',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? '***' : 'MISSING'
  });

  try {

    const googleId = profile.id;
    const email = profile.emails?.[0]?.value;
    const username = profile.displayName || "Google User";
    let photo = profile.photos?.[0]?.value || null;
    photo = getHighResGooglePhotoUrl(photo);

    if (!email) {
      return done(new Error("Google účet nemá email"));
    }

    // 🔍 1. NAJPRV hľadaj podľa google_id (HLAVNÉ!)
    const [googleUsers] = await db.execute(
      'SELECT * FROM chat_users WHERE google_id = ?',
      [googleId]
    );

    if (googleUsers.length > 0) {
      // Keep existing local profile picture to avoid duplicate downloads
      if (!googleUsers[0].profile_picture && photo) {
        let localPhoto = null;
        try {
          localPhoto = await downloadGoogleProfilePic(photo, googleId);
        } catch (e) {
          localPhoto = null;
        }
        if (localPhoto) {
          await db.execute('UPDATE chat_users SET profile_picture = ? WHERE id = ?', [localPhoto, googleUsers[0].id]);
          const [updated] = await db.execute('SELECT * FROM chat_users WHERE id = ?', [googleUsers[0].id]);
          return done(null, updated[0]);
        }
      }
      return done(null, googleUsers[0]);
    }

    // 🔍 2. Ak user existuje s týmto emailom (napr. sa registroval normálne)
    const [emailUsers] = await db.execute(
      'SELECT * FROM chat_users WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    if (emailUsers.length > 0) {
      // Prepoj účet; profilovku nastav len ak ešte nemá uloženú
      let localPhoto = emailUsers[0].profile_picture || null;
      if (!localPhoto && photo) {
        try {
          localPhoto = await downloadGoogleProfilePic(photo, googleId);
        } catch (e) {
          localPhoto = null;
        }
      }
      await db.execute(
        'UPDATE chat_users SET google_id = ?, is_verified = TRUE, profile_picture = ? WHERE id = ?',
        [googleId, localPhoto, emailUsers[0].id]
      );
      const [updated] = await db.execute('SELECT * FROM chat_users WHERE id = ?', [emailUsers[0].id]);
      return done(null, updated[0]);
    }

    // ➕ 3. Ak user neexistuje → vytvor nový
    const googlePassword = 'google_oauth';


    let localPhoto = null;
    if (photo) {
      try {
        localPhoto = await downloadGoogleProfilePic(photo, googleId);
      } catch (e) {
        localPhoto = null;
      }
    }

    const [result] = await db.execute(
      `INSERT INTO chat_users 
      (username, email, password, google_id, profile_picture, is_verified) 
      VALUES (?, ?, ?, ?, ?, TRUE)`,
      [username, email, googlePassword, googleId, localPhoto, ]
    );

    const [newUser] = await db.execute(
      'SELECT * FROM chat_users WHERE id = ?',
      [result.insertId]
    );

    return done(null, newUser[0]);

  } catch (err) {
    console.error('Google OAuth verify error:', err);
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await db.execute(
      'SELECT * FROM chat_users WHERE id = ?',
      [id]
    );
    done(null, users[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;