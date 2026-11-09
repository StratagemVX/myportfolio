import 'dotenv/config';
import nodemailer from 'nodemailer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { formatIST, sha256 } from './cryptoUtils.ts';
import { maskEmail, maskPhone } from './types.ts';
import type { 
  DeliveryStatus, 
  NotificationDeliveryRecord, 
  TwilioComprehensiveDiagnostics 
} from './types.ts';

export interface SecurityNotificationPayload {
  eventType: string;
  subject: string;
  headline: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    browser?: string;
    os?: string;
    actor?: string;
    timestampIST?: string;
  };
}

export interface DispatchResult {
  success: boolean;
  status: DeliveryStatus;
  record: NotificationDeliveryRecord | null;
  message: string;
  providerMessageId?: string | null;
  errorCode?: string | null;
  instructions?: string;
  trialNotice?: string;
  operationStats?: any;
}

const NOTIFICATIONS_FILE = path.join(process.cwd(), 'server', 'notifications-log.json');

class NotificationService {
  private history: NotificationDeliveryRecord[] = [];
  private idempotencyCache: Map<string, number> = new Map(); // Key -> timestamp ms
  
  // Confirmed Twilio Account Owner Email
  public get twilioAccountEmail(): string {
    return process.env.TWILIO_ACCOUNT_EMAIL || 'karnashaiva81@gmail.com';
  }

  // Primary destinations stored server-side only; never exposed unmasked to frontend bundles
  public get ownerEmail(): string {
    return process.env.OWNER_ALERT_EMAIL || 'the.suryaputraa@gmail.com';
  }
  public get ownerMobile(): string {
    return process.env.OWNER_ALERT_PHONE_E164 || '+919380469287';
  }
  public get ownerWhatsApp(): string {
    return process.env.OWNER_WHATSAPP_PHONE_E164 || process.env.OWNER_ALERT_PHONE_E164 || '+919380469287';
  }

  // Twilio Trial Mode status
  public get isTwilioTrialMode(): boolean {
    return process.env.TWILIO_TRIAL_MODE !== 'false';
  }

  constructor() {
    this.loadHistory();
  }

  private loadHistory() {
    try {
      if (fs.existsSync(NOTIFICATIONS_FILE)) {
        const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.history = (Array.isArray(parsed) ? parsed : []).map(r => this.normalizeRecord(r));
      }
    } catch {
      this.history = [];
    }
  }

  private normalizeRecord(r: any): NotificationDeliveryRecord {
    let status: DeliveryStatus = r.status || 'UNKNOWN';
    if (r.status === 'CONFIGURATION_REQUIRED' || r.status === 'NOT_CONFIGURED') {
      status = 'BLOCKED_CONFIGURATION';
    } else if (r.status === 'AWAITING_CREDENTIALS') {
      status = 'BLOCKED_CONFIGURATION';
    } else if (r.status === 'AWAITING_PHONE_VERIFICATION' || r.status === 'AWAITING_RECIPIENT_CONSENT') {
      status = 'AWAITING_RECIPIENT_VERIFICATION';
    } else if (r.status === 'PENDING_BUSINESS_APPROVAL') {
      status = 'AWAITING_BUSINESS_APPROVAL';
    } else if (r.status === 'READY') {
      status = 'ACCEPTED';
    } else if (r.status === 'SENDING') {
      status = 'DISPATCHING';
    } else if (r.status === 'ACCEPTED_DELIVERY_UNCONFIRMED') {
      status = 'ACCEPTED';
    }

    const timestamp = r.timestamp || new Date().toISOString();
    const timestampIST = r.timestampIST || r.attemptedAtIST || formatIST(new Date(timestamp));

    return {
      id: r.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      timestampIST,
      channel: r.channel || 'EMAIL',
      destinationMasked: r.destinationMasked || (r.channel === 'EMAIL' ? maskEmail(this.ownerEmail) : maskPhone(this.ownerMobile)),
      eventType: r.eventType || 'SECURITY_NOTIFICATION',
      subject: r.subject,
      contentPreview: r.contentPreview || '',
      status,
      provider: r.provider || 'System Notification Engine',
      providerMessageId: r.providerMessageId || null,
      errorCode: r.errorCode || null,
      errorInfo: r.errorInfo || r.errorDetails || null,
      createdAt: r.createdAt || timestamp,
      createdAtIST: r.createdAtIST || timestampIST,
      updatedAt: r.updatedAt || timestamp,
      updatedAtIST: r.updatedAtIST || timestampIST,
      idempotencyKey: r.idempotencyKey || `idemp_legacy_${r.id || Date.now()}`,
      operationStats: r.operationStats,
      errorDetails: r.errorInfo || r.errorDetails || null,
      attemptedAtIST: r.attemptedAtIST || timestampIST,
      confirmedAtIST: r.confirmedAtIST || null
    };
  }

  private saveHistory() {
    try {
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(this.history.slice(0, 150), null, 2));
    } catch {
      // Ignore write errors
    }
  }

  public getHistory(): NotificationDeliveryRecord[] {
    return [...this.history];
  }

  /**
   * Collision-resistant idempotency key generator
   */
  public generateIdempotencyKey(channel: string, eventType: string, destination: string, content: string): string {
    const timeBucket = Math.floor(Date.now() / 60000); // 60-second debounce
    const raw = `${channel}:${eventType}:${destination}:${content.trim()}:${timeBucket}`;
    return `idemp_${sha256(raw).substring(0, 24)}`;
  }

  /**
   * Check if a dispatch with the same idempotency key was executed within the 60s window
   */
  public isDuplicateDispatch(idempotencyKey: string): boolean {
    const lastSeen = this.idempotencyCache.get(idempotencyKey);
    if (lastSeen && (Date.now() - lastSeen < 60000)) {
      return true;
    }
    this.idempotencyCache.set(idempotencyKey, Date.now());
    if (this.idempotencyCache.size > 200) {
      const now = Date.now();
      for (const [k, v] of this.idempotencyCache.entries()) {
        if (now - v > 600000) this.idempotencyCache.delete(k);
      }
    }
    return false;
  }

  /**
   * Construct Twilio HTTP Basic Auth Header
   * Priority: Restricted API Key (TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET)
   * Fallback: Account SID + Rotated Auth Token
   */
  public getTwilioAuthHeader(): string | null {
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    const hasValidApiKey = Boolean(
      apiKeySid &&
      apiKeySecret &&
      apiKeySecret !== apiKeySid &&
      !apiKeySecret.startsWith('SK')
    );

    if (hasValidApiKey) {
      return Buffer.from(`${apiKeySid}:${apiKeySecret}`).toString('base64');
    }
    if (accountSid && authToken) {
      return Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    }
    return null;
  }

  /**
   * Professional HTML email template adhering to Part 4 requirements:
   * - Administrator login
   * - New device login
   * - Suspicious activity
   * - Password reset requested / changed
   * - MFA / Passkey mutations
   * - Security test notification
   * - Asia/Kolkata IST timestamps
   * - Editorial Dark Theme (Graphite #181A1F, Slate #22252C, Soft White #F0F0ED, Muted Sage #A8B8A7)
   */
  public buildProfessionalEmailHtml(payload: SecurityNotificationPayload, timestampIST: string): string {
    const isTest = payload.eventType.includes('TEST');
    const isCritical = payload.severity === 'CRITICAL';
    const isWarning = payload.severity === 'WARNING';
    const accentColor = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#A8B8A7';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${payload.subject}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #101114; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F0F0ED;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #181A1F; border: 1px solid #22252C; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 24px 28px; border-bottom: 1px solid #22252C; background-color: #121317;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family: monospace; font-size: 11px; letter-spacing: 0.08em; color: ${accentColor}; text-transform: uppercase;">
                      ${isTest ? 'Twilio Comms Diagnostic Dispatch' : 'Portfolio Owner Security Dispatch'}
                    </span>
                    <h1 style="margin: 8px 0 0 0; font-size: 18px; font-weight: 500; color: #F0F0ED;">${payload.headline}</h1>
                  </td>
                  <td align="right" valign="top">
                    <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-family: monospace; font-weight: 600; color: ${accentColor}; border: 1px solid ${accentColor}40; background-color: ${accentColor}15;">
                      ${payload.severity}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 28px;">
              <p style="font-size: 14px; line-height: 1.6; color: #A4A8AE; margin: 0 0 20px 0;">
                ${payload.details}
              </p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #101114; border: 1px solid #22252C; border-radius: 6px; padding: 16px; margin-bottom: 24px; font-family: monospace; font-size: 12px; color: #F0F0ED;">
                <tr><td style="padding: 5px 0; color: #A4A8AE; width: 130px;">Event Type:</td><td style="padding: 5px 0; font-weight: 600; color: #A8B8A7;">${payload.eventType}</td></tr>
                <tr><td style="padding: 5px 0; color: #A4A8AE;">Time (IST):</td><td style="padding: 5px 0;">${timestampIST}</td></tr>
                ${payload.metadata?.ipAddress ? `<tr><td style="padding: 5px 0; color: #A4A8AE;">IP Address:</td><td style="padding: 5px 0;">${payload.metadata.ipAddress}</td></tr>` : ''}
                ${payload.metadata?.browser ? `<tr><td style="padding: 5px 0; color: #A4A8AE;">Client:</td><td style="padding: 5px 0;">${payload.metadata.browser} (${payload.metadata.os || 'Unknown OS'})</td></tr>` : ''}
                ${payload.metadata?.actor ? `<tr><td style="padding: 5px 0; color: #A4A8AE;">Actor:</td><td style="padding: 5px 0;">${payload.metadata.actor}</td></tr>` : ''}
              </table>

              <p style="font-size: 12px; line-height: 1.6; color: #A4A8AE; margin: 0;">
                If you did not authorize this action, immediately access your administrative security console to terminate active sessions and inspect audit trails:
              </p>
              <div style="margin-top: 18px;">
                <a href="https://chethankumar.dev/admin" style="display: inline-block; background-color: #A8B8A7; color: #101114; padding: 10px 20px; border-radius: 4px; font-size: 12px; font-weight: 600; text-decoration: none;">Review Security Center</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 28px; background-color: #101114; border-top: 1px solid #22252C; font-size: 11px; color: #6E727A; text-align: center;">
              Chethan Kumar Portfolio Security Subsystem · Dispatched via Twilio Delivery Pipeline
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Part 4: Dispatch Email Security Alert using Twilio Comms Email API (or Resend/SMTP fallback).
   * Official Twilio Comms Email endpoint: POST https://comms.twilio.com/v1/Emails
   * Request format:
   * {
   *   "from": { "address": CONFIGURED_VERIFIED_SENDER, "name": "Portfolio Security" },
   *   "to": [ { "address": CONFIGURED_OWNER_EMAIL } ],
   *   "content": { "subject": "...", "html": "..." }
   * }
   * Returns asynchronous operation response with operationId.
   */
  public async sendEmailSecurityAlert(payload: SecurityNotificationPayload): Promise<DispatchResult> {
    const now = new Date();
    const timestampIST = payload.metadata?.timestampIST || formatIST(now);
    const destination = this.ownerEmail;
    const destinationMasked = maskEmail(destination);
    const bodyHtml = this.buildProfessionalEmailHtml(payload, timestampIST);
    const plainText = `
[PORTFOLIO OWNER SECURITY NOTIFICATION]
${payload.headline}

${payload.details}

Event: ${payload.eventType}
Timestamp: ${timestampIST}
Severity: ${payload.severity}
Security Console: https://chethankumar.dev/admin
    `.trim();

    const idempotencyKey = this.generateIdempotencyKey('EMAIL', payload.eventType, destination, payload.headline);

    // 1. Idempotency Check
    if (this.isDuplicateDispatch(idempotencyKey)) {
      return {
        success: true,
        status: 'ACCEPTED',
        record: null,
        message: 'Duplicate email alert suppressed by idempotency protection.'
      };
    }

    const eventId = `email_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // 2. Twilio Comms Email API (Primary / Verified Pattern)
    const twilioAuthHeader = this.getTwilioAuthHeader();
    const twilioEmailFrom = process.env.TWILIO_EMAIL_FROM_ADDRESS || process.env.EMAIL_FROM_ADDRESS;
    const emailProvider = process.env.EMAIL_PROVIDER || 'twilio';
    const twilioEmailBaseUrl = process.env.TWILIO_EMAIL_API_BASE_URL || 'https://comms.twilio.com/v1/Emails';

    const canUseTwilioEmail = Boolean(twilioAuthHeader && (twilioEmailFrom || emailProvider === 'twilio'));

    if (canUseTwilioEmail && emailProvider !== 'resend') {
      const senderAddress = twilioEmailFrom || 'security@chethankumar.dev';
      try {
        const res = await fetch(twilioEmailBaseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuthHeader}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            from: {
              address: senderAddress,
              name: 'Portfolio Security'
            },
            to: [
              {
                address: destination
              }
            ],
            content: {
              subject: payload.subject,
              html: bodyHtml
            }
          })
        });

        const data = await res.json().catch(() => null);

        // Twilio Comms Email returns 202 Accepted with operationId
        if ((res.status === 202 || res.status === 200 || res.status === 201) && (data?.operationId || data?.id)) {
          const operationId = data.operationId || data.id;
          const initialStatus: DeliveryStatus = 'QUEUED'; // Asynchronous operation accepted & queued

          const record: NotificationDeliveryRecord = {
            id: eventId,
            timestamp: now.toISOString(),
            timestampIST,
            channel: 'EMAIL',
            destinationMasked,
            eventType: payload.eventType,
            subject: payload.subject,
            contentPreview: payload.headline,
            status: initialStatus,
            provider: 'Twilio Comms Email',
            providerMessageId: operationId,
            errorInfo: null,
            createdAt: now.toISOString(),
            createdAtIST: timestampIST,
            updatedAt: now.toISOString(),
            updatedAtIST: timestampIST,
            idempotencyKey,
            attemptedAtIST: timestampIST,
            confirmedAtIST: null,
            operationStats: {
              operationStatus: 'QUEUED',
              total: 1,
              queued: 1,
              sent: 0,
              delivered: 0,
              failed: 0
            }
          };

          this.history.unshift(record);
          this.saveHistory();

          // Quick bounded poll to check if operation resolved immediately
          try {
            const polled = await this.pollEmailOperation(operationId);
            if (polled && polled.status !== 'QUEUED') {
              record.status = polled.status;
              if (polled.status === 'DELIVERED') {
                record.confirmedAtIST = polled.confirmedAtIST || timestampIST;
              }
            }
          } catch {
            // Async fallback is nominal
          }

          return {
            success: true,
            status: record.status,
            record,
            providerMessageId: operationId,
            message: `Twilio Comms Email operation created. Operation ID: ${operationId}. Initial status: ${record.status}.`
          };
        } else {
          const rawErr = data?.message || data?.error || `HTTP ${res.status}`;
          const isRejection = res.status === 401 || res.status === 403;
          const status: DeliveryStatus = isRejection ? 'REJECTED' : 'FAILED';
          const sanitizedErr = `[Twilio Email Error ${res.status}]: ${String(rawErr)}`;

          const record: NotificationDeliveryRecord = {
            id: eventId,
            timestamp: now.toISOString(),
            timestampIST,
            channel: 'EMAIL',
            destinationMasked,
            eventType: payload.eventType,
            subject: payload.subject,
            contentPreview: payload.headline,
            status,
            provider: 'Twilio Comms Email',
            providerMessageId: null,
            errorCode: String(res.status),
            errorInfo: sanitizedErr,
            createdAt: now.toISOString(),
            createdAtIST: timestampIST,
            updatedAt: now.toISOString(),
            updatedAtIST: timestampIST,
            idempotencyKey,
            errorDetails: sanitizedErr,
            attemptedAtIST: timestampIST
          };

          this.history.unshift(record);
          this.saveHistory();

          return {
            success: false,
            status,
            record,
            message: sanitizedErr,
            instructions: 'Verify TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, and ensure TWILIO_EMAIL_FROM_ADDRESS is an authorised sender domain in Twilio.'
          };
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const record: NotificationDeliveryRecord = {
          id: eventId,
          timestamp: now.toISOString(),
          timestampIST,
          channel: 'EMAIL',
          destinationMasked,
          eventType: payload.eventType,
          subject: payload.subject,
          contentPreview: payload.headline,
          status: 'FAILED',
          provider: 'Twilio Comms Email',
          providerMessageId: null,
          errorInfo: `Twilio Email connection error: ${errorMsg}`,
          createdAt: now.toISOString(),
          createdAtIST: timestampIST,
          updatedAt: now.toISOString(),
          updatedAtIST: timestampIST,
          idempotencyKey,
          errorDetails: errorMsg,
          attemptedAtIST: timestampIST
        };
        this.history.unshift(record);
        this.saveHistory();

        return {
          success: false,
          status: 'FAILED',
          record,
          message: `Network failure connecting to Twilio Comms Email: ${errorMsg}`
        };
      }
    }

    // 3. Alternative: Resend API
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM_ADDRESS || 'security@chethankumar.dev',
            to: destination,
            subject: payload.subject,
            html: bodyHtml,
            text: plainText
          })
        });

        const data = await res.json().catch(() => null);
        if (res.ok && data?.id) {
          const record: NotificationDeliveryRecord = {
            id: eventId,
            timestamp: now.toISOString(),
            timestampIST,
            channel: 'EMAIL',
            destinationMasked,
            eventType: payload.eventType,
            subject: payload.subject,
            contentPreview: payload.headline,
            status: 'ACCEPTED',
            provider: 'Resend API',
            providerMessageId: data.id,
            errorInfo: null,
            createdAt: now.toISOString(),
            createdAtIST: timestampIST,
            updatedAt: now.toISOString(),
            updatedAtIST: timestampIST,
            idempotencyKey,
            attemptedAtIST: timestampIST,
            confirmedAtIST: null
          };
          this.history.unshift(record);
          this.saveHistory();
          return {
            success: true,
            status: 'ACCEPTED',
            record,
            providerMessageId: data.id,
            message: `Email accepted by Resend API. Reference: ${data.id}`
          };
        } else {
          const errMsg = data?.message || `HTTP ${res.status}`;
          const isRejection = res.status === 401 || res.status === 403;
          const status: DeliveryStatus = isRejection ? 'REJECTED' : 'FAILED';
          const record: NotificationDeliveryRecord = {
            id: eventId,
            timestamp: now.toISOString(),
            timestampIST,
            channel: 'EMAIL',
            destinationMasked,
            eventType: payload.eventType,
            subject: payload.subject,
            contentPreview: payload.headline,
            status,
            provider: 'Resend API',
            providerMessageId: null,
            errorInfo: String(errMsg),
            createdAt: now.toISOString(),
            createdAtIST: timestampIST,
            updatedAt: now.toISOString(),
            updatedAtIST: timestampIST,
            idempotencyKey,
            errorDetails: String(errMsg),
            attemptedAtIST: timestampIST
          };
          this.history.unshift(record);
          this.saveHistory();
          return {
            success: false,
            status,
            record,
            message: `Resend API rejected delivery: ${errMsg}`
          };
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          status: 'FAILED',
          record: null,
          message: `Network error connecting to Resend: ${errorMsg}`
        };
      }
    }

    // 4. Fallback: Direct SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM_ADDRESS || 'security@chethankumar.dev',
          to: destination,
          subject: payload.subject,
          text: plainText,
          html: bodyHtml
        });

        const record: NotificationDeliveryRecord = {
          id: eventId,
          timestamp: now.toISOString(),
          timestampIST,
          channel: 'EMAIL',
          destinationMasked,
          eventType: payload.eventType,
          subject: payload.subject,
          contentPreview: payload.headline,
          status: 'ACCEPTED',
          provider: `SMTP (${process.env.SMTP_HOST})`,
          providerMessageId: info.messageId,
          errorInfo: null,
          createdAt: now.toISOString(),
          createdAtIST: timestampIST,
          updatedAt: now.toISOString(),
          updatedAtIST: timestampIST,
          idempotencyKey,
          attemptedAtIST: timestampIST
        };
        this.history.unshift(record);
        this.saveHistory();
        return {
          success: true,
          status: 'ACCEPTED',
          record,
          providerMessageId: info.messageId,
          message: `Email accepted by SMTP. ID: ${info.messageId}`
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          status: 'FAILED',
          record: null,
          message: `SMTP delivery failed: ${errorMsg}`
        };
      }
    }

    return {
      success: false,
      status: 'BLOCKED_CONFIGURATION',
      record: null,
      message: 'No email provider configured. Configure TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, and TWILIO_EMAIL_FROM_ADDRESS.',
      instructions: 'Configure TWILIO_API_KEY_SID and TWILIO_EMAIL_FROM_ADDRESS in server environment.'
    };
  }

  /**
   * Part 3: Dispatch Twilio Programmable SMS.
   * Endpoint: POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
   * Parameters: To, From / MessagingServiceSid, Body, StatusCallback
   */
  public async sendSmsSecurityAlert(message?: string, eventType = 'CRITICAL_SECURITY_ALERT'): Promise<DispatchResult> {
    const now = new Date();
    const timestampIST = formatIST(now);
    const destination = this.ownerMobile;
    const destinationMasked = maskPhone(destination);

    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authHeader = this.getTwilioAuthHeader();
    const fromNumber = process.env.TWILIO_FROM_NUMBER || '';
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || '';

    // Truthful default SMS test message from Part 3
    const finalMessage = message || 'Test notification: Your portfolio security notification service is working.';

    // 1. Preflight Credential Check
    if (!accountSid || !authHeader) {
      return {
        success: false,
        status: 'BLOCKED_CONFIGURATION',
        record: null,
        message: 'Twilio SMS credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET.',
        instructions: 'Add TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, and TWILIO_API_KEY_SECRET to server environment.'
      };
    }

    if (!fromNumber && !messagingServiceSid) {
      return {
        success: false,
        status: 'BLOCKED_CONFIGURATION',
        record: null,
        message: 'Neither TWILIO_FROM_NUMBER nor TWILIO_MESSAGING_SERVICE_SID is configured.',
        instructions: 'Set TWILIO_FROM_NUMBER to an active SMS-capable Twilio number or set TWILIO_MESSAGING_SERVICE_SID.'
      };
    }

    if (fromNumber && fromNumber === destination) {
      return {
        success: false,
        status: 'BLOCKED_CONFIGURATION',
        record: null,
        message: 'TWILIO_FROM_NUMBER cannot be identical to destination OWNER_ALERT_PHONE_E164.',
        instructions: 'TWILIO_FROM_NUMBER must be your Twilio-provided virtual phone number, while destination is your personal mobile.'
      };
    }

    // 2. Preflight Trial Mode Recipient Verification Check
    const isDestinationVerified = Boolean(
      process.env.TWILIO_VERIFIED_RECIPIENT_PHONE === destination ||
      process.env.PHONE_OWNERSHIP_VERIFIED === 'true'
    );

    if (this.isTwilioTrialMode && !isDestinationVerified) {
      return {
        success: false,
        status: 'AWAITING_RECIPIENT_VERIFICATION',
        record: null,
        message: `Twilio Trial Account: Destination ${destination} must be added to Verified Caller IDs in Twilio Console.`,
        instructions: 'Log into Twilio Console > Phone Numbers > Manage > Verified Caller IDs > Add +919380469287 and complete OTP verification.',
        trialNotice: 'Twilio trial accounts can only dispatch SMS to verified recipient phone numbers.'
      };
    }

    // 3. Idempotency Check
    const idempotencyKey = this.generateIdempotencyKey('SMS', eventType, destination, finalMessage);
    if (this.isDuplicateDispatch(idempotencyKey)) {
      return {
        success: true,
        status: 'ACCEPTED',
        record: null,
        message: 'Duplicate SMS alert suppressed by idempotency protection.'
      };
    }

    const eventId = `sms_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    try {
      const params = new URLSearchParams();
      params.append('To', destination);
      if (messagingServiceSid) {
        params.append('MessagingServiceSid', messagingServiceSid);
      } else {
        params.append('From', fromNumber);
      }
      params.append('Body', finalMessage);

      const statusCallback = process.env.TWILIO_SMS_STATUS_CALLBACK_URL || process.env.TWILIO_STATUS_CALLBACK_URL;
      if (statusCallback) {
        params.append('StatusCallback', statusCallback);
      }

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.sid) {
        // Initial queued result means the request was accepted and queued; not delivered.
        const rawStatus = (data.status || 'queued').toLowerCase();
        const initialStatus: DeliveryStatus = rawStatus === 'queued' ? 'QUEUED' : 'ACCEPTED';

        const record: NotificationDeliveryRecord = {
          id: eventId,
          timestamp: now.toISOString(),
          timestampIST,
          channel: 'SMS',
          destinationMasked,
          eventType,
          contentPreview: finalMessage.substring(0, 80),
          status: initialStatus,
          provider: this.isTwilioTrialMode ? 'Twilio SMS (Trial)' : 'Twilio Programmable SMS',
          providerMessageId: data.sid,
          errorInfo: null,
          createdAt: now.toISOString(),
          createdAtIST: timestampIST,
          updatedAt: now.toISOString(),
          updatedAtIST: timestampIST,
          idempotencyKey,
          attemptedAtIST: timestampIST,
          confirmedAtIST: null
        };
        this.history.unshift(record);
        this.saveHistory();

        // Optional bounded immediate check
        try {
          const polled = await this.pollSmsMessage(data.sid);
          if (polled && polled.status !== 'QUEUED') {
            record.status = polled.status;
            if (polled.status === 'DELIVERED') {
              record.confirmedAtIST = timestampIST;
            }
          }
        } catch {
          // Bounded fallback
        }

        return {
          success: true,
          status: record.status,
          record,
          providerMessageId: data.sid,
          message: `SMS request accepted by Twilio. SID: ${data.sid}. Initial status: ${record.status}.`
        };
      } else {
        const twilioCode = data?.code;
        const rawErrMsg = data?.message || `HTTP ${res.status}`;
        const sanitizedErrMsg = `[Twilio Error ${twilioCode || res.status}]: ${rawErrMsg.replace(/AC[a-f0-9]{32}/gi, 'AC••••••••')}`;

        let status: DeliveryStatus = 'FAILED';
        let instructions = 'Check Twilio credentials and outbound sender capabilities.';
        if (twilioCode === 21608) {
          status = 'AWAITING_RECIPIENT_VERIFICATION';
          instructions = 'Destination +919380469287 is unverified. Verify under Twilio Console > Verified Caller IDs.';
        } else if (res.status === 401 || res.status === 403) {
          status = 'REJECTED';
          instructions = 'Twilio authentication failed. Verify TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET.';
        }

        const record: NotificationDeliveryRecord = {
          id: eventId,
          timestamp: now.toISOString(),
          timestampIST,
          channel: 'SMS',
          destinationMasked,
          eventType,
          contentPreview: finalMessage.substring(0, 80),
          status,
          provider: 'Twilio SMS Gateway',
          providerMessageId: null,
          errorCode: String(twilioCode || res.status),
          errorInfo: sanitizedErrMsg,
          createdAt: now.toISOString(),
          createdAtIST: timestampIST,
          updatedAt: now.toISOString(),
          updatedAtIST: timestampIST,
          idempotencyKey,
          errorDetails: sanitizedErrMsg,
          attemptedAtIST: timestampIST
        };
        this.history.unshift(record);
        this.saveHistory();

        return {
          success: false,
          status,
          record,
          errorCode: String(twilioCode || res.status),
          message: sanitizedErrMsg,
          instructions
        };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const record: NotificationDeliveryRecord = {
        id: eventId,
        timestamp: now.toISOString(),
        timestampIST,
        channel: 'SMS',
        destinationMasked,
        eventType,
        contentPreview: finalMessage.substring(0, 80),
        status: 'FAILED',
        provider: 'Twilio SMS Gateway',
        providerMessageId: null,
        errorInfo: `Twilio network failure: ${errorMsg}`,
        createdAt: now.toISOString(),
        createdAtIST: timestampIST,
        updatedAt: now.toISOString(),
        updatedAtIST: timestampIST,
        idempotencyKey,
        errorDetails: errorMsg,
        attemptedAtIST: timestampIST
      };
      this.history.unshift(record);
      this.saveHistory();
      return {
        success: false,
        status: 'FAILED',
        record,
        message: `Network error connecting to Twilio SMS: ${errorMsg}`
      };
    }
  }

  /**
   * Part 5: Dispatch Twilio WhatsApp Message.
   * Endpoint: POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
   * Parameters: To (whatsapp:+...), From (whatsapp:+...), Body, StatusCallback
   */
  public async sendWhatsAppSecurityAlert(message?: string, eventType = 'CRITICAL_SECURITY_ALERT'): Promise<DispatchResult> {
    const now = new Date();
    const timestampIST = formatIST(now);
    const destination = this.ownerWhatsApp;
    const destinationMasked = maskPhone(destination);

    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authHeader = this.getTwilioAuthHeader();
    const whatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    const isSandbox = whatsAppFrom.includes('+14155238886') || whatsAppFrom.includes('sandbox');
    const isSandboxJoined = Boolean(
      process.env.TWILIO_WHATSAPP_SANDBOX_JOINED === 'true' ||
      process.env.WHATSAPP_OWNERSHIP_VERIFIED === 'true'
    );

    const finalMessage = message || `[Portfolio Security Test] WhatsApp alert pipeline operational at ${timestampIST}.`;

    if (!accountSid || !authHeader) {
      return {
        success: false,
        status: 'BLOCKED_CONFIGURATION',
        record: null,
        message: 'Twilio credentials not configured for WhatsApp. Set TWILIO_ACCOUNT_SID and TWILIO_API_KEY_SID.',
        instructions: 'Configure TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, and TWILIO_WHATSAPP_FROM.'
      };
    }

    if (isSandbox && !isSandboxJoined) {
      return {
        success: false,
        status: 'AWAITING_RECIPIENT_VERIFICATION',
        record: null,
        message: 'Twilio WhatsApp Sandbox Opt-In Required before dispatch.',
        instructions: "Send 'join <keyword>' from your WhatsApp on +919380469287 to +1 415 523 8886 to enable sandbox alerts.",
        trialNotice: 'Twilio WhatsApp Sandbox requires manual recipient opt-in keyword before sending business alerts.'
      };
    }

    const idempotencyKey = this.generateIdempotencyKey('WHATSAPP', eventType, destination, finalMessage);
    if (this.isDuplicateDispatch(idempotencyKey)) {
      return {
        success: true,
        status: 'ACCEPTED',
        record: null,
        message: 'Duplicate WhatsApp alert suppressed by idempotency protection.'
      };
    }

    const eventId = `wa_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    try {
      const fromParam = whatsAppFrom.startsWith('whatsapp:') ? whatsAppFrom : `whatsapp:${whatsAppFrom}`;
      const toParam = destination.startsWith('whatsapp:') ? destination : `whatsapp:${destination}`;

      const params = new URLSearchParams();
      params.append('From', fromParam);
      params.append('To', toParam);
      params.append('Body', finalMessage);

      const statusCallback = process.env.TWILIO_WHATSAPP_STATUS_CALLBACK_URL || process.env.TWILIO_STATUS_CALLBACK_URL;
      if (statusCallback) {
        params.append('StatusCallback', statusCallback);
      }

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.sid) {
        const rawStatus = (data.status || 'queued').toLowerCase();
        const initialStatus: DeliveryStatus = rawStatus === 'queued' ? 'QUEUED' : 'ACCEPTED';

        const record: NotificationDeliveryRecord = {
          id: eventId,
          timestamp: now.toISOString(),
          timestampIST,
          channel: 'WHATSAPP',
          destinationMasked,
          eventType,
          contentPreview: finalMessage.substring(0, 80),
          status: initialStatus,
          provider: isSandbox ? 'Twilio WhatsApp Sandbox' : 'Twilio WhatsApp Business',
          providerMessageId: data.sid,
          errorInfo: null,
          createdAt: now.toISOString(),
          createdAtIST: timestampIST,
          updatedAt: now.toISOString(),
          updatedAtIST: timestampIST,
          idempotencyKey,
          attemptedAtIST: timestampIST,
          confirmedAtIST: null
        };
        this.history.unshift(record);
        this.saveHistory();

        return {
          success: true,
          status: record.status,
          record,
          providerMessageId: data.sid,
          message: `WhatsApp message accepted by Twilio. SID: ${data.sid}. Initial status: ${record.status}.`
        };
      } else {
        const twilioCode = data?.code;
        const rawErrMsg = data?.message || `HTTP ${res.status}`;
        const sanitizedErrMsg = `[Twilio WhatsApp ${twilioCode || res.status}]: ${rawErrMsg.replace(/AC[a-f0-9]{32}/gi, 'AC••••••••')}`;

        let status: DeliveryStatus = 'FAILED';
        let instructions = 'Check Twilio WhatsApp sender registration.';
        if (twilioCode === 63015 || twilioCode === 21608) {
          status = 'AWAITING_RECIPIENT_VERIFICATION';
          instructions = "Recipient has not joined sandbox. Send 'join <keyword>' from WhatsApp to +1 415 523 8886.";
        } else if (res.status === 401 || res.status === 403) {
          status = 'REJECTED';
          instructions = 'Twilio authentication rejected. Check API key credentials.';
        }

        const record: NotificationDeliveryRecord = {
          id: eventId,
          timestamp: now.toISOString(),
          timestampIST,
          channel: 'WHATSAPP',
          destinationMasked,
          eventType,
          contentPreview: finalMessage.substring(0, 80),
          status,
          provider: 'Twilio WhatsApp',
          providerMessageId: null,
          errorCode: String(twilioCode || res.status),
          errorInfo: sanitizedErrMsg,
          createdAt: now.toISOString(),
          createdAtIST: timestampIST,
          updatedAt: now.toISOString(),
          updatedAtIST: timestampIST,
          idempotencyKey,
          errorDetails: sanitizedErrMsg,
          attemptedAtIST: timestampIST
        };
        this.history.unshift(record);
        this.saveHistory();

        return {
          success: false,
          status,
          record,
          errorCode: String(twilioCode || res.status),
          message: sanitizedErrMsg,
          instructions
        };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        status: 'FAILED',
        record: null,
        message: `Network error connecting to Twilio WhatsApp: ${errorMsg}`
      };
    }
  }

  /**
   * Part 4: Poll Twilio Comms Email Operation.
   * Endpoint: GET https://comms.twilio.com/v1/Emails/Operations/{operationId}
   * Inspects: operationStatus, totalRecipientCount, queuedCount, sentCount, deliveredCount, undeliveredCount, failedCount
   */
  public async pollEmailOperation(operationId: string): Promise<{ status: DeliveryStatus; operationStats: any; confirmedAtIST?: string } | null> {
    const authHeader = this.getTwilioAuthHeader();
    if (!authHeader) return null;
    const baseUrl = process.env.TWILIO_EMAIL_API_BASE_URL || 'https://comms.twilio.com/v1/Emails';
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/Operations/${operationId}`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) return null;
      const data = await res.json();
      const opStatus = data.operationStatus || data.status || 'UNKNOWN';
      const total = data.totalRecipientCount ?? data.total ?? 1;
      const queued = data.queuedCount ?? 0;
      const sent = data.sentCount ?? 0;
      const delivered = data.deliveredCount ?? 0;
      const undelivered = data.undeliveredCount ?? 0;
      const failed = data.failedCount ?? 0;

      // Strict delivery proof: only deliveredCount >= 1 transitions to DELIVERED
      let status: DeliveryStatus = 'ACCEPTED';
      if (delivered > 0) {
        status = 'DELIVERED';
      } else if (failed > 0 || undelivered > 0) {
        status = 'FAILED';
      } else if (sent > 0) {
        status = 'SENT';
      } else if (queued > 0 || opStatus === 'QUEUED') {
        status = 'QUEUED';
      }

      const operationStats = {
        operationStatus: opStatus,
        total,
        queued,
        sent,
        delivered,
        undelivered,
        failed,
        updatedTimestamp: data.updatedTimestamp || new Date().toISOString()
      };

      const record = this.history.find(h => h.providerMessageId === operationId);
      if (record) {
        record.status = status;
        record.operationStats = operationStats;
        record.updatedAt = new Date().toISOString();
        record.updatedAtIST = formatIST(new Date());
        if (status === 'DELIVERED') {
          record.confirmedAtIST = record.updatedAtIST;
        }
        this.saveHistory();
      }

      return {
        status,
        operationStats,
        confirmedAtIST: status === 'DELIVERED' ? formatIST(new Date()) : undefined
      };
    } catch {
      return null;
    }
  }

  /**
   * Part 3: Poll Twilio Programmable SMS / WhatsApp Message Resource.
   * Endpoint: GET https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages/{MessageSid}.json
   * Tracks: queued, sending, sent, delivered, undelivered, failed
   * Does NOT equate sent with delivered.
   */
  public async pollSmsMessage(messageSid: string): Promise<{ status: DeliveryStatus; rawStatus: string } | null> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authHeader = this.getTwilioAuthHeader();
    if (!accountSid || !authHeader) return null;

    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}.json`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) return null;
      const data = await res.json();
      const rawStatus = (data.status || '').toLowerCase();

      let status: DeliveryStatus = 'ACCEPTED';
      if (rawStatus === 'delivered' || rawStatus === 'read') {
        status = 'DELIVERED';
      } else if (rawStatus === 'sent') {
        status = 'SENT'; // Preserved as SENT, not premature DELIVERED
      } else if (rawStatus === 'queued') {
        status = 'QUEUED';
      } else if (rawStatus === 'sending') {
        status = 'DISPATCHING';
      } else if (rawStatus === 'failed' || rawStatus === 'undelivered') {
        status = 'FAILED';
      }

      const record = this.history.find(h => h.providerMessageId === messageSid);
      if (record) {
        record.status = status;
        record.updatedAt = new Date().toISOString();
        record.updatedAtIST = formatIST(new Date());
        if (status === 'DELIVERED') {
          record.confirmedAtIST = record.updatedAtIST;
        }
        if (data.error_message || data.error_code) {
          record.errorCode = String(data.error_code || '');
          record.errorInfo = data.error_message || `Twilio code ${data.error_code}`;
        }
        this.saveHistory();
      }

      return { status, rawStatus };
    } catch {
      return null;
    }
  }

  /**
   * Unified Poller fallback for frontend or background status synchronization
   */
  public async pollDeliveryStatus(channel: 'EMAIL' | 'SMS' | 'WHATSAPP', providerMessageId: string): Promise<NotificationDeliveryRecord | null> {
    if (channel === 'EMAIL') {
      await this.pollEmailOperation(providerMessageId);
    } else {
      await this.pollSmsMessage(providerMessageId);
    }
    return this.history.find(h => h.providerMessageId === providerMessageId) || null;
  }

  /**
   * Part 8: Process incoming provider delivery webhooks with status callbacks
   */
  public updateDeliveryStatus(providerMessageId: string, status: DeliveryStatus, details?: string, errorCode?: string): boolean {
    const record = this.history.find(h => h.providerMessageId === providerMessageId);
    if (record) {
      record.status = status;
      record.updatedAt = new Date().toISOString();
      record.updatedAtIST = formatIST(new Date());
      if (status === 'DELIVERED') {
        record.confirmedAtIST = record.updatedAtIST;
      }
      if (errorCode) {
        record.errorCode = errorCode;
      }
      if (details) {
        record.errorInfo = details;
        record.errorDetails = details;
      }
      this.saveHistory();
      return true;
    }
    return false;
  }

  /**
   * Part 10: Comprehensive Diagnostics and Configuration Status
   */
  public getComprehensiveDiagnostics(): TwilioComprehensiveDiagnostics {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const hasAccountSid = Boolean(accountSid && accountSid.startsWith('AC'));
    const hasApiKey = Boolean(
      process.env.TWILIO_API_KEY_SID && 
      process.env.TWILIO_API_KEY_SECRET &&
      process.env.TWILIO_API_KEY_SECRET !== process.env.TWILIO_API_KEY_SID &&
      !process.env.TWILIO_API_KEY_SECRET.startsWith('SK')
    );
    const hasAuthToken = Boolean(process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_AUTH_TOKEN.length >= 30);
    const authMode = hasApiKey ? 'RESTRICTED_API_KEY' : hasAuthToken ? 'ROTATED_AUTH_TOKEN' : 'NONE';

    const fromNumber = process.env.TWILIO_FROM_NUMBER || '';
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || null;
    const isDestinationVerified = Boolean(
      process.env.TWILIO_VERIFIED_RECIPIENT_PHONE === this.ownerMobile ||
      process.env.PHONE_OWNERSHIP_VERIFIED === 'true'
    );

    const emailFrom = process.env.TWILIO_EMAIL_FROM_ADDRESS || process.env.EMAIL_FROM_ADDRESS || '';
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    const whatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    const isWaSandbox = whatsAppFrom.includes('+14155238886') || whatsAppFrom.includes('sandbox');
    const isWaJoined = Boolean(
      process.env.TWILIO_WHATSAPP_SANDBOX_JOINED === 'true' ||
      process.env.WHATSAPP_OWNERSHIP_VERIFIED === 'true'
    );

    // Latest dispatches
    const latestEmail = this.history.find(h => h.channel === 'EMAIL');
    const latestSms = this.history.find(h => h.channel === 'SMS');
    const latestWa = this.history.find(h => h.channel === 'WHATSAPP');

    // Missing configuration list
    const missing: string[] = [];
    if (!hasAccountSid) missing.push('TWILIO_ACCOUNT_SID is missing.');
    if (!hasApiKey && !hasAuthToken) missing.push('TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET (or rotated TWILIO_AUTH_TOKEN) are missing.');
    if (!fromNumber && !messagingServiceSid) missing.push('TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID is missing for SMS.');
    if (this.isTwilioTrialMode && !isDestinationVerified) missing.push('Recipient +919380469287 is not verified under Twilio Console > Verified Caller IDs.');
    if (!emailFrom && !hasResend && !hasSmtp) missing.push('TWILIO_EMAIL_FROM_ADDRESS is missing for Twilio Comms Email.');
    if (isWaSandbox && !isWaJoined) missing.push("Twilio WhatsApp Sandbox requires sending 'join <keyword>' to +1 415 523 8886.");

    return {
      account: {
        accountEmail: this.twilioAccountEmail,
        accountEmailMasked: maskEmail(this.twilioAccountEmail),
        accountSidConfigured: hasAccountSid,
        accountSidMasked: hasAccountSid ? `${accountSid.substring(0, 4)}••••••••` : 'Not Configured',
        authMode,
        isTrialAccount: this.isTwilioTrialMode,
        status: (hasAccountSid && (hasApiKey || hasAuthToken)) ? 'AUTHENTICATED' : 'CONFIGURATION_REQUIRED',
        connectivity: (hasAccountSid && (hasApiKey || hasAuthToken)) ? 'CONNECTED' : 'DISCONNECTED'
      },
      sms: {
        senderConfigured: Boolean(fromNumber || messagingServiceSid),
        fromNumber: fromNumber || (messagingServiceSid ? `MessagingService: ${messagingServiceSid}` : 'Not Configured'),
        messagingServiceSid,
        destinationMasked: maskPhone(this.ownerMobile),
        recipientVerified: isDestinationVerified,
        geoPermissionsIndia: true,
        apiConnectivity: Boolean(hasAccountSid && (hasApiKey || hasAuthToken)),
        latestMessageSid: latestSms?.providerMessageId || null,
        latestStatus: latestSms?.status || (hasAccountSid && fromNumber ? 'ACCEPTED' : 'BLOCKED_CONFIGURATION'),
        deliveryConfirmation: latestSms?.confirmedAtIST || null
      },
      email: {
        provider: (hasApiKey || hasAuthToken) && emailFrom ? 'TWILIO_COMMS_EMAIL' : hasResend ? 'RESEND' : hasSmtp ? 'SMTP' : 'UNCONFIGURED',
        apiBaseUrl: process.env.TWILIO_EMAIL_API_BASE_URL || 'https://comms.twilio.com/v1/Emails',
        senderConfigured: Boolean(emailFrom || hasResend || hasSmtp),
        fromAddress: emailFrom || process.env.EMAIL_FROM_ADDRESS || 'security@chethankumar.dev',
        destinationMasked: maskEmail(this.ownerEmail),
        latestOperationId: latestEmail?.providerMessageId || null,
        latestOperationStatus: latestEmail?.operationStats?.operationStatus || null,
        deliveredCount: latestEmail?.operationStats?.delivered ?? (latestEmail?.status === 'DELIVERED' ? 1 : 0),
        failedCount: latestEmail?.operationStats?.failed ?? (latestEmail?.status === 'FAILED' ? 1 : 0),
        queuedCount: latestEmail?.operationStats?.queued ?? (latestEmail?.status === 'QUEUED' ? 1 : 0)
      },
      whatsapp: {
        senderConfigured: Boolean(whatsAppFrom),
        fromAddress: whatsAppFrom,
        destinationMasked: maskPhone(this.ownerWhatsApp),
        isSandbox: isWaSandbox,
        sandboxJoined: isWaJoined,
        businessApproved: !isWaSandbox,
        latestMessageSid: latestWa?.providerMessageId || null,
        latestStatus: latestWa?.status || (hasAccountSid ? 'ACCEPTED' : 'BLOCKED_CONFIGURATION')
      },
      missingConfiguration: missing
    };
  }

  /**
   * Compatibility provider status
   */
  public getProviderStatus() {
    const diag = this.getComprehensiveDiagnostics();
    const latestEmail = this.history.find(h => h.channel === 'EMAIL');
    const latestSms = this.history.find(h => h.channel === 'SMS');
    const latestWhatsApp = this.history.find(h => h.channel === 'WHATSAPP');

    const lastDeliveredEmail = this.history.find(h => h.channel === 'EMAIL' && h.status === 'DELIVERED');
    const lastFailedEmail = this.history.find(h => h.channel === 'EMAIL' && (h.status === 'FAILED' || h.status === 'BOUNCED' || h.status === 'REJECTED'));

    const lastDeliveredSms = this.history.find(h => h.channel === 'SMS' && h.status === 'DELIVERED');
    const lastFailedSms = this.history.find(h => h.channel === 'SMS' && (h.status === 'FAILED' || h.status === 'REJECTED'));

    const lastDeliveredWa = this.history.find(h => h.channel === 'WHATSAPP' && h.status === 'DELIVERED');
    const lastFailedWa = this.history.find(h => h.channel === 'WHATSAPP' && (h.status === 'FAILED' || h.status === 'REJECTED'));

    return {
      email: {
        provider: diag.email.provider === 'TWILIO_COMMS_EMAIL' 
          ? 'Twilio Comms Email API' 
          : diag.email.provider === 'RESEND' 
          ? 'Resend Transactional API' 
          : diag.email.provider === 'SMTP' 
          ? 'SMTP Gateway' 
          : 'Twilio Comms Email (Awaiting Configuration)',
        status: latestEmail ? latestEmail.status : diag.email.senderConfigured ? 'ACCEPTED' : 'BLOCKED_CONFIGURATION',
        destinationMasked: diag.email.destinationMasked,
        fromAddress: diag.email.fromAddress,
        domainVerified: Boolean(process.env.TWILIO_EMAIL_DOMAIN_VERIFIED === 'true' || process.env.RESEND_DOMAIN_VERIFIED === 'true'),
        apiKeyConfigured: diag.account.accountSidConfigured && diag.account.authMode !== 'NONE',
        lastAttemptedAtIST: latestEmail?.timestampIST || null,
        lastDeliveredAtIST: lastDeliveredEmail?.confirmedAtIST || null,
        lastFailedAtIST: lastFailedEmail?.timestampIST || null,
        lastProviderReference: latestEmail?.providerMessageId || null,
        lastError: latestEmail?.errorInfo || null,
        operationStats: latestEmail?.operationStats || null
      },
      sms: {
        provider: diag.account.isTrialAccount ? 'Twilio SMS (Trial Account)' : 'Twilio Programmable SMS',
        status: latestSms ? latestSms.status : diag.sms.recipientVerified ? 'ACCEPTED' : 'BLOCKED_CONFIGURATION',
        destinationMasked: diag.sms.destinationMasked,
        isTrialAccount: diag.account.isTrialAccount,
        accountSidConfigured: diag.account.accountSidConfigured,
        accountSidMasked: diag.account.accountSidMasked,
        accountEmail: diag.account.accountEmail,
        accountEmailMasked: diag.account.accountEmailMasked,
        apiKeyConfigured: diag.account.authMode === 'RESTRICTED_API_KEY',
        authTokenConfigured: diag.account.authMode === 'ROTATED_AUTH_TOKEN',
        authMode: diag.account.authMode,
        fromNumber: diag.sms.fromNumber,
        destinationVerified: diag.sms.recipientVerified,
        geoPermissions: 'India (+91) Enabled',
        trialNotice: diag.account.isTrialAccount
          ? 'Twilio Trial Account active. Destination +919380469287 must be verified in Twilio Console under Verified Caller IDs.' 
          : 'Twilio Production Account',
        lastAttemptedAtIST: latestSms?.timestampIST || null,
        lastDeliveredAtIST: lastDeliveredSms?.confirmedAtIST || null,
        lastFailedAtIST: lastFailedSms?.timestampIST || null,
        lastProviderReference: latestSms?.providerMessageId || null,
        lastError: latestSms?.errorInfo || null
      },
      whatsapp: {
        provider: diag.whatsapp.isSandbox ? 'Twilio WhatsApp Sandbox' : 'Twilio WhatsApp Business',
        status: latestWhatsApp ? latestWhatsApp.status : diag.whatsapp.sandboxJoined ? 'ACCEPTED' : 'BLOCKED_CONFIGURATION',
        destinationMasked: diag.whatsapp.destinationMasked,
        senderType: diag.whatsapp.isSandbox ? 'SANDBOX' : 'PRODUCTION',
        fromAddress: diag.whatsapp.fromAddress,
        recipientJoined: diag.whatsapp.sandboxJoined,
        templateApproved: true,
        trialNotice: diag.whatsapp.isSandbox 
          ? "Twilio WhatsApp Sandbox: Recipient must send 'join <keyword>' to +1 415 523 8886." 
          : 'Twilio WhatsApp Production Sender',
        lastAttemptedAtIST: latestWhatsApp?.timestampIST || null,
        lastDeliveredAtIST: lastDeliveredWa?.confirmedAtIST || null,
        lastFailedAtIST: lastFailedWa?.timestampIST || null,
        lastProviderReference: latestWhatsApp?.providerMessageId || null,
        lastError: latestWhatsApp?.errorInfo || null
      }
    };
  }
}

export const notificationService = new NotificationService();
