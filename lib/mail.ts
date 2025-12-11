import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

/**
 * Configuration du transport sendmail
 * Utilise sendmail installé sur le serveur (sendmail-8.15.2-34.el8.x86_64)
 */
const transport = nodemailer.createTransport({
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail', // Chemin standard de sendmail sur Linux
});

/**
 * Interface pour les options d'envoi d'email
 */
export interface SendMailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Envoie un email via sendmail
 * 
 * @param options - Les options d'envoi d'email (destinataire, sujet, contenu)
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 * 
 * @example
 * ```typescript
 * const result = await sendMail({
 *   to: "user@example.com",
 *   subject: "Bienvenue",
 *   html: "<h1>Bonjour</h1>",
 *   text: "Bonjour"
 * });
 * ```
 */
export async function sendMail(options: SendMailOptions): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { 
      to, 
      from = process.env.MAIL_FROM || 'noreply@harp.local',
      subject, 
      html, 
      text,
      cc,
      bcc
    } = options;

    // Valider que le contenu est fourni
    if (!html && !text) {
      return { 
        success: false, 
        error: "Le contenu de l'email (html ou text) est requis" 
      };
    }

    // Préparer les destinataires
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    const ccRecipients = cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined;
    const bccRecipients = bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined;

    const mailOptions: Mail.Options = {
      from,
      to: recipients,
      subject,
      html,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : undefined),
      cc: ccRecipients,
      bcc: bccRecipients,
    };

    const sendResult = await transport.sendMail(mailOptions);

    return { 
      success: true, 
      message: `Email envoyé avec succès à ${recipients}` 
    };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur lors de l'envoi de l'email" 
    };
  }
}

/**
 * Fonction simplifiée pour envoyer un email avec formatage HTML basique
 * 
 * @param to - Adresse email du destinataire
 * @param name - Nom du destinataire (pour le formatage)
 * @param subject - Sujet de l'email
 * @param body - Corps de l'email (HTML)
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 */
export async function sendMailSimple({ 
  to, 
  name, 
  subject, 
  body 
}: { 
  to: string; 
  name: string; 
  subject: string; 
  body: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(to right, #f97316, #ea580c); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Portail HARP</h1>
          </div>
          <div class="content">
            <p>Bonjour ${name},</p>
            ${body}
          </div>
          <div class="footer">
            <p>Cet email a été envoyé depuis le Portail HARP</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail({
    to,
    subject,
    html: htmlBody,
    text: body.replace(/<[^>]*>/g, ''),
  });
}