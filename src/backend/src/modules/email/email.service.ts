import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('smtp.host');
    const user = this.config.get<string>('smtp.user');
    const pass = this.config.get<string>('smtp.pass');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('smtp.port') || 587,
        secure: false,
        auth: { user, pass },
      });
      this.logger.log('Email service configured');
    } else {
      this.logger.warn('SMTP not configured — emails will be logged only');
    }
  }

  async send(opts: MailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.debug(`[EMAIL STUB] To: ${opts.to} | Subject: ${opts.subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"Tradewind" <${this.config.get('smtp.user')}>`,
        ...opts,
      });
      this.logger.log(`Email sent to ${opts.to}: ${opts.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}: ${err.message}`);
    }
  }

  async sendInvite(to: string, token: string, role: string, inviterName: string, factoryName?: string) {
    const frontendUrl = this.config.get<string>('frontendUrl');
    const link = `${frontendUrl}/invite/${token}`;
    const roleLabel = role === 'factory' ? 'завода-партнёра' : 'консультанта';

    await this.send({
      to,
      subject: `Приглашение на Tradewind — роль ${roleLabel}`,
      text: `${inviterName} приглашает вас как ${roleLabel}. Перейдите по ссылке: ${link}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Приглашение на Tradewind</h2>
          <p><strong>${inviterName}</strong> приглашает вас присоединиться как <strong>${roleLabel}</strong>${factoryName ? ` для завода <strong>${factoryName}</strong>` : ''}.</p>
          <p>Ссылка действует <strong>48 часов</strong> и является одноразовой.</p>
          <a href="${link}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#C0392B;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Принять приглашение
          </a>
          <p style="margin-top:24px;color:#888;font-size:13px">Если вы не ожидали это письмо — просто проигнорируйте.</p>
        </div>
      `,
    });
  }

  async sendPasswordReset(to: string, token: string) {
    const frontendUrl = this.config.get<string>('frontendUrl');
    const link = `${frontendUrl}/reset-password?token=${token}`;

    await this.send({
      to,
      subject: 'Сброс пароля Tradewind',
      text: `Для сброса пароля перейдите по ссылке: ${link}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Сброс пароля</h2>
          <p>Вы запросили сброс пароля для аккаунта Tradewind.</p>
          <a href="${link}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#C0392B;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Сбросить пароль
          </a>
          <p style="margin-top:16px;color:#888;font-size:13px">Ссылка действует 1 час. Если вы не запрашивали сброс — проигнорируйте.</p>
        </div>
      `,
    });
  }

  async sendConsultantApproved(to: string, name: string, tempPassword?: string) {
    await this.send({
      to,
      subject: 'Ваша заявка на Tradewind одобрена',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Добро пожаловать, ${name}!</h2>
          <p>Ваша заявка консультанта одобрена. Первые 5 сделок проходят под наблюдением команды Tradewind.</p>
          ${tempPassword ? `<p>Временный пароль: <strong style="font-family:monospace">${tempPassword}</strong></p><p>Пожалуйста, смените его после первого входа.</p>` : ''}
          <a href="${this.config.get('frontendUrl')}/login" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#C0392B;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Войти в кабинет
          </a>
        </div>
      `,
    });
  }
}
