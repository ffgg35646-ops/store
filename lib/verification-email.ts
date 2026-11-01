function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

export function buildVerificationEmail(name: string, verifyUrl: string) {
  const safeName = escapeHtml(name || "عميلنا");
  const safeUrl = escapeHtml(verifyUrl);
  const subject = "تأكيد بريدك الإلكتروني | Verify your email";
  const text = [
    `مرحبًا ${name || "بك"}،`,
    "شكرًا لانضمامك إلى Nova Digital.",
    "اضغط على الرابط التالي لتأكيد بريدك الإلكتروني:",
    verifyUrl,
    "صلاحية الرابط 10 دقائق فقط. إذا لم تطلب إنشاء الحساب، يمكنك تجاهل هذه الرسالة.",
    "",
    "Hello, welcome to Nova Digital. Verify your email using the link above. This link expires in 10 minutes.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:Arial,Tahoma,sans-serif;color:#171a22;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">أكد بريدك الإلكتروني وفعّل حساب Nova Digital. الرابط صالح لمدة 10 دقائق.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f8fa;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e9ee;border-radius:20px;overflow:hidden;">
        <tr><td align="center" style="padding:30px 24px;background:#211b3d;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
            <td align="center" width="44" height="44" style="width:44px;height:44px;border-radius:14px;background:#7057ed;color:#ffffff;font-size:25px;font-weight:800;">N</td>
            <td style="padding-right:12px;color:#ffffff;text-align:right;font-size:19px;font-weight:800;letter-spacing:.4px;">NOVA DIGITAL<br><span style="font-size:9px;font-weight:600;letter-spacing:2px;color:#c9c2ff;">THE DIGITAL MARKETPLACE</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:34px 32px 12px;text-align:right;">
          <div style="display:inline-block;padding:6px 11px;border-radius:20px;background:#f0edff;color:#5740d4;font-size:11px;font-weight:700;">تأكيد الحساب · ACCOUNT VERIFICATION</div>
          <h1 style="margin:18px 0 10px;font-size:25px;line-height:1.5;color:#171a22;">مرحبًا ${safeName} 👋</h1>
          <p style="margin:0;color:#555e6d;font-size:15px;line-height:1.9;">يسعدنا انضمامك إلى <strong style="color:#211b3d;">Nova Digital</strong>. أكّد بريدك الإلكتروني لتفعيل حسابك والبدء في استكشاف المتجر.</p>
        </td></tr>
        <tr><td align="center" style="padding:22px 32px 16px;">
          <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:15px 30px;border-radius:12px;background:#7057ed;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">تأكيد البريد الإلكتروني</a>
        </td></tr>
        <tr><td style="padding:8px 32px 26px;text-align:right;">
          <div style="padding:16px;border:1px solid #e7e9ee;border-radius:12px;background:#fafbfc;">
            <p style="margin:0 0 6px;color:#211b3d;font-size:13px;font-weight:700;">تنبيه مهم</p>
            <p style="margin:0;color:#6f7785;font-size:12px;line-height:1.8;">رابط التأكيد صالح لمدة <strong style="color:#d34f60;">10 دقائق فقط</strong>، ويستخدم مرة واحدة. إذا لم تنشئ هذا الحساب، يمكنك تجاهل الرسالة.</p>
          </div>
          <p style="margin:22px 0 6px;color:#7a8290;font-size:11px;line-height:1.8;">إذا لم يعمل الزر، انسخ الرابط التالي وافتحه في المتصفح:</p>
          <p dir="ltr" style="margin:0;word-break:break-all;text-align:left;font-size:11px;line-height:1.7;"><a href="${safeUrl}" style="color:#7057ed;">${safeUrl}</a></p>
        </td></tr>
        <tr><td style="padding:20px 24px;background:#f0edff;text-align:center;">
          <p style="margin:0;color:#5740d4;font-size:11px;font-weight:700;">WELCOME TO NOVA DIGITAL</p>
          <p style="margin:6px 0 0;color:#7a8290;font-size:10px;">اشتراكاتك ومنتجاتك الرقمية في مكان واحد.</p>
          <p style="margin:6px 0 0;color:#9aa0ac;font-size:10px;">© ${new Date().getFullYear()} Nova Digital</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;color:#9aa0ac;font-size:10px;">هذه رسالة آلية، يرجى عدم الرد عليها.</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
