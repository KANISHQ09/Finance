import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

/**
 * Send an email verification link to a newly registered user.
 */
export async function sendVerificationEmail({
  email,
  name,
  url,
}: {
  email: string;
  name: string;
  url: string;
}): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your FinNext email</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0d1528 0%,#111827 100%);border-radius:16px;border:1px solid #1e3a5f;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(90deg,#0ea5e9 0%,#6366f1 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">FinNext</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">AI-Powered Portfolio Intelligence</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#f1f5f9;font-size:22px;font-weight:700;">Verify your email, ${name} 👋</h2>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.7;">
                You're one step away from unlocking your personalized AI portfolio dashboard. Click the button below to verify your email and start investing smarter.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:linear-gradient(90deg,#0ea5e9,#6366f1);border-radius:10px;padding:1px;">
                    <a href="${url}" style="display:block;padding:14px 36px;background:linear-gradient(90deg,#0ea5e9,#6366f1);border-radius:9px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">
                      ✓ Verify My Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy and paste this link:</p>
              <p style="margin:0 0 32px;color:#0ea5e9;font-size:12px;word-break:break-all;">${url}</p>
              <hr style="border:none;border-top:1px solid #1e293b;margin:0 0 24px;" />
              <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">
                This link expires in <strong style="color:#94a3b8;">1 hour</strong>. If you didn't create a FinNext account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;text-align:center;border-top:1px solid #1e293b;">
              <p style="margin:0;color:#334155;font-size:11px;">© 2025 FinNext · AI Portfolio Intelligence</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"FinNext" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: "Verify your FinNext email address",
    text: `Hi ${name}, verify your email by visiting: ${url}`,
    html,
  });
}

/**
 * Send a password-reset link email.
 */
export async function sendPasswordResetEmail({
  email,
  name,
  url,
}: {
  email: string;
  name: string;
  url: string;
}): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your FinNext password</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;border:1px solid #212328;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(to bottom,#FDD458,#E8BA40);padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#050505;font-size:26px;font-weight:800;letter-spacing:-0.5px;">FinNext</h1>
              <p style="margin:6px 0 0;color:rgba(5,5,5,0.65);font-size:13px;">AI-Powered Portfolio Intelligence</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#f5f5f5;font-size:22px;font-weight:700;">Reset your password, ${name}</h2>
              <p style="margin:0 0 24px;color:#9095A1;font-size:15px;line-height:1.7;">
                We received a request to reset the password for your FinNext account. Click the button below to choose a new password.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="border-radius:10px;background:linear-gradient(to bottom,#FDD458,#E8BA40);padding:1px;">
                    <a href="${url}" style="display:block;padding:14px 36px;background:linear-gradient(to bottom,#FDD458,#E8BA40);border-radius:9px;color:#050505;font-size:15px;font-weight:700;text-decoration:none;">
                      🔐 Reset My Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy and paste this link:</p>
              <p style="margin:0 0 32px;color:#FDD458;font-size:12px;word-break:break-all;">${url}</p>
              <hr style="border:none;border-top:1px solid #212328;margin:0 0 24px;" />
              <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">
                This link expires in <strong style="color:#9095A1;">1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your account remains secure.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;text-align:center;border-top:1px solid #212328;">
              <p style="margin:0;color:#30333A;font-size:11px;">© 2025 FinNext · AI Portfolio Intelligence</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"FinNext" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: "Reset your FinNext password",
    text: `Hi ${name}, reset your password by visiting: ${url}`,
    html,
  });
}
