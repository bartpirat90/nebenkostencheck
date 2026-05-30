import nodemailer from "nodemailer";

// Lazy-Init: Transport erst beim ersten Aufruf erstellen, damit der Build
// (ohne gesetzte SMTP-Env-Variablen) das Modul importieren kann, ohne zu werfen.
let _transport: nodemailer.Transporter | null = null;
function transport() {
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST!, // smtp.ionos.de
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: true, // 465 = SSL
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    });
  }
  return _transport;
}

export async function sendLetterPdf(
  to: string,
  pdfBase64: string,
  filename: string,
  subject: string,
) {
  await transport().sendMail({
    from: `Nebenkostencheck <${process.env.SMTP_USER}>`,
    to,
    subject,
    text: `Anbei dein erstelltes Schreiben als PDF. Du kannst es ausdrucken oder an deinen Vermieter weiterleiten.\n\nViele Grüße\nNebenkostencheck`,
    attachments: [{ filename, content: Buffer.from(pdfBase64, "base64") }],
  });
}
