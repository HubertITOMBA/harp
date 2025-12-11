import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

/**
 * Configuration du transport email
 * Par défaut, utilise SMTP via les variables d'environnement.
 * Pour utiliser sendmail (Linux uniquement), définir USE_SENDMAIL=true
 */
const useSendmail = process.env.USE_SENDMAIL === 'true';

const transport = useSendmail
  ? nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: process.env.SENDMAIL_PATH || '/usr/sbin/sendmail',
    })
  : (() => {
      const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '25', 10);
      const host = process.env.MAIL_HOST || process.env.SMTP_HOST || '';
      
      // Port 25 = SMTP standard (non sécurisé, pas de TLS)
      // Port 587 = SMTP avec STARTTLS (sécurisé mais pas SSL)
      // Port 465 = SMTPS (SSL/TLS direct)
      const isPort25 = port === 25;
      const isPort465 = port === 465;
      
      // Déterminer si on utilise secure (SSL direct) ou requireTLS (STARTTLS)
      const secure = process.env.MAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true' || isPort465;
      const requireTLS = !isPort25 && !isPort465 && process.env.MAIL_REQUIRE_TLS !== 'false';
      
      // Configuration de base
      const config: SMTPTransport.Options = {
        host,
        port,
        secure: secure, // true pour SSL direct (port 465), false pour STARTTLS (port 587) ou non sécurisé (port 25)
        requireTLS: requireTLS, // Forcer STARTTLS pour les ports non-SSL
        auth: process.env.MAIL_USER || process.env.SMTP_USER
          ? {
              user: process.env.MAIL_USER || process.env.SMTP_USER || '',
              pass: process.env.MAIL_PASSWORD || process.env.SMTP_PASSWORD || '',
            }
          : undefined,
      };
      
      // Pour le port 25 ou si MAIL_IGNORE_TLS_ERRORS est true, désactiver la vérification du certificat
      if (isPort25 || process.env.MAIL_IGNORE_TLS_ERRORS === 'true') {
        config.tls = {
          rejectUnauthorized: false, // Ne pas vérifier le certificat SSL/TLS
        };
      }
      
      return nodemailer.createTransport(config);
    })();

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
 * Envoie un email via SMTP (par défaut) ou sendmail (si USE_SENDMAIL=true)
 * 
 * Configuration SMTP (par défaut) :
 * Variables d'environnement requises :
 *   - MAIL_HOST ou SMTP_HOST : Serveur SMTP (ex: smtp.gmail.com ou IP: 138.35.24.152)
 *   - MAIL_PORT ou SMTP_PORT : Port SMTP 
 *     * Port 25 : SMTP standard (non sécurisé, pas de TLS)
 *     * Port 587 : SMTP avec STARTTLS (recommandé)
 *     * Port 465 : SMTPS avec SSL/TLS direct
 *   - MAIL_USER ou SMTP_USER : Nom d'utilisateur SMTP (optionnel pour port 25)
 *   - MAIL_PASSWORD ou SMTP_PASSWORD : Mot de passe SMTP (optionnel pour port 25)
 *   - MAIL_SECURE ou SMTP_SECURE : "true" pour SSL direct (port 465), "false" pour STARTTLS (port 587) ou non sécurisé (port 25)
 *   - MAIL_REQUIRE_TLS : "false" pour désactiver STARTTLS (défaut: "true" sauf port 25)
 *   - MAIL_IGNORE_TLS_ERRORS : "true" pour ignorer les erreurs de certificat SSL/TLS (utile pour IP au lieu de domaine)
 *   - MAIL_FROM : Adresse expéditeur (optionnel, défaut: noreply@harp.local)
 * 
 * Configuration sendmail (optionnel, Linux uniquement) :
 *   - USE_SENDMAIL=true : Active l'utilisation de sendmail
 *   - SENDMAIL_PATH : Chemin vers sendmail (optionnel, défaut: /usr/sbin/sendmail)
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

    // Vérifier que les variables SMTP sont configurées (sauf si sendmail est utilisé)
    if (!useSendmail) {
      const smtpHost = process.env.MAIL_HOST || process.env.SMTP_HOST;
      if (!smtpHost) {
        return {
          success: false,
          error: "Configuration SMTP manquante. Veuillez définir MAIL_HOST ou SMTP_HOST dans votre fichier .env"
        };
      }
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

    await transport.sendMail(mailOptions);

    return { 
      success: true, 
      message: `Email envoyé avec succès à ${recipients}` 
    };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    
    // Message d'erreur plus explicite selon le type d'erreur
    let errorMessage = "Erreur lors de l'envoi de l'email";
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        errorMessage = useSendmail
          ? "Sendmail non trouvé. Veuillez installer sendmail ou configurer SENDMAIL_PATH"
          : "Configuration SMTP manquante. Veuillez configurer MAIL_HOST, MAIL_PORT, MAIL_USER et MAIL_PASSWORD dans votre fichier .env";
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        errorMessage = "Impossible de se connecter au serveur SMTP. Vérifiez MAIL_HOST et MAIL_PORT";
      } else if (error.message.includes('EAUTH')) {
        errorMessage = "Échec de l'authentification SMTP. Vérifiez MAIL_USER et MAIL_PASSWORD";
      } else if (error.message.includes('certificate') || error.message.includes('cert') || error.message.includes('ESOCKET')) {
        errorMessage = "Erreur de certificat SSL/TLS. Ajoutez MAIL_IGNORE_TLS_ERRORS=true dans votre .env pour ignorer cette vérification";
      } else {
        errorMessage = error.message;
      }
    }
    
    return { 
      success: false, 
      error: errorMessage
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