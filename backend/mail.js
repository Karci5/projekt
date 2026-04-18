const { Resend } = require("resend");
require("dotenv").config();

const resendApiKey = process.env.RESEND_API_KEY || "";
const mailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";
const frontendUrl = String(process.env.FRONTEND_URL || "https://projekt-frontend-05yt.onrender.com").replace(/\/$/, "");

function getResend() {
  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not set");
    return null;
  }
  return new Resend(resendApiKey);
}

function buildEmailLayout({ title, intro, ctaLabel, ctaLink, bodyHtml, footerHtml }) {
  return `
    <div style="margin:0; padding:24px; background:#f4f7fb; font-family:Arial,Helvetica,sans-serif; color:#0f172a;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
        <tr>
          <td style="padding:22px 24px; background:linear-gradient(135deg, #0f172a, #1e3a8a); color:#ffffff;">
            <div style="font-size:14px; opacity:0.88;">Karol Chat App</div>
            <div style="font-size:22px; font-weight:700; margin-top:6px;">${title}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px; line-height:1.6; font-size:15px;">
            <p style="margin:0 0 14px 0; color:#334155;">${intro}</p>
            ${bodyHtml}
            ${ctaLink ? `
              <div style="margin:22px 0 18px 0;">
                <a href="${ctaLink}" style="display:inline-block; background:#1d4ed8; color:#ffffff; text-decoration:none; font-weight:600; padding:12px 18px; border-radius:10px;">${ctaLabel}</a>
              </div>
            ` : ""}
            <div style="margin-top:18px; padding:12px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; word-break:break-all; color:#475569; font-size:13px;">
              ${footerHtml}
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// Funkcia na odoslanie verifikačného kódu/linku
const sendVerificationEmail = async (email, verificationCode, verificationLink = null) => {
  try {
    const resend = getResend();
    if (!resend) return false;

    const { data, error } = await resend.emails.send({
      from: mailFrom,
      to: email,
      subject: "Email verifikácia - Chat App",
      html: buildEmailLayout({
        title: "Potvrdenie emailu",
        intro: "Vitaj v Karol Chat App. Dokonči registráciu potvrdením emailovej adresy.",
        ctaLabel: "Potvrdiť email",
        ctaLink: verificationLink,
        bodyHtml: `
          <p style="margin:0 0 10px 0; color:#334155;">Tvoj verifikačný kód:</p>
          <div style="display:inline-block; font-family:Consolas,Monaco,monospace; font-size:34px; letter-spacing:8px; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; padding:10px 14px; border-radius:10px; font-weight:700;">${verificationCode}</div>
          <p style="margin:14px 0 0 0; color:#475569;">Kód je platný 15 minút.</p>
        `,
        footerHtml: verificationLink
          ? `Ak tlačidlo nefunguje, otvor tento odkaz:<br/><a href="${verificationLink}" style="color:#1d4ed8;">${verificationLink}</a><br/><br/>Ak si účet nevytváral, tento email môžeš ignorovať.`
          : `Ak si účet nevytváral, tento email môžeš ignorovať.`,
      }),
    });

    if (error) {
      console.error("Verification email error:", error);
      return false;
    }
    console.log("Verification email sent:", { to: email, id: data.id });
    return true;
  } catch (err) {
    console.error("Chyba pri odosielaní emailu:", err.message || err);
    return false;
  }
};

// Funkcia na odoslanie odkazu na obnovenie hesla
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resend = getResend();
    if (!resend) return { success: false, reason: "RESEND_API_KEY nie je nastavený" };

    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: mailFrom,
      to: email,
      subject: "Obnovenie hesla - Chat App",
      html: buildEmailLayout({
        title: "Obnovenie hesla",
        intro: "Dostali sme požiadavku na obnovenie hesla k tvojmu účtu.",
        ctaLabel: "Obnoviť heslo",
        ctaLink: resetLink,
        bodyHtml: `
          <p style="margin:0; color:#475569;">Pre bezpečnosť je odkaz platný iba 1 hodinu.</p>
        `,
        footerHtml: `Ak tlačidlo nefunguje, otvor tento odkaz:<br/><a href="${resetLink}" style="color:#1d4ed8;">${resetLink}</a><br/><br/>Ak si obnovu hesla nepožadoval, tento email môžeš ignorovať.`,
      }),
    });

    if (error) {
      console.error("Password reset email error:", error);
      return { success: false, reason: error.message || JSON.stringify(error) };
    }
    console.log("Password reset email sent:", { to: email, id: data.id });
    return { success: true };
  } catch (err) {
    console.error("Chyba pri odosielaní emailu:", err.message || err);
    return { success: false, reason: err.message || String(err) };
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
