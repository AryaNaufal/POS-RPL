type SendPasswordResetInput = {
  toEmail: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({ toEmail, resetUrl }: SendPasswordResetInput) {
  const from = process.env.SMTP_FROM_EMAIL;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!from || !host || !user || !pass) {
    console.info("[password-reset] SMTP not configured. Reset link:", {
      toEmail,
      resetUrl,
    });
    return { delivered: false };
  }

  const nodemailerModule = await import("nodemailer");
  const transporter = nodemailerModule.default.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: "Reset Password Akun POS",
    text: [
      "Anda menerima email ini karena ada permintaan reset password.",
      "",
      `Buka tautan berikut untuk mengganti password: ${resetUrl}`,
      "",
      "Jika Anda tidak meminta reset password, abaikan email ini.",
    ].join("\n"),
  });

  return { delivered: true };
}
