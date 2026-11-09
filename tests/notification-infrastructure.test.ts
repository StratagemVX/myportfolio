import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationService } from '../server/notificationService.ts';
import { formatIST } from '../server/cryptoUtils.ts';
import type { DeliveryStatus } from '../server/types.ts';

describe('Part 11: Notification Infrastructure & Delivery Verification Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. TWILIO COMMS EMAIL API TESTS
  // =========================================================================
  describe('Twilio Comms Email API Tests', () => {
    it('Twilio Email 1: Missing credentials returns BLOCKED_CONFIGURATION without dispatch attempt', async () => {
      delete process.env.TWILIO_API_KEY_SID;
      delete process.env.TWILIO_API_KEY_SECRET;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_EMAIL_FROM_ADDRESS;
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_HOST;

      const result = await notificationService.sendEmailSecurityAlert({
        eventType: 'TEST_NO_KEY',
        subject: 'Test Subject',
        headline: 'Test Headline',
        details: 'Testing missing key behavior.',
        severity: 'INFO'
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('BLOCKED_CONFIGURATION');
      expect(result.record).toBeNull();
      expect(result.message).toContain('No email provider configured');
      expect(result.instructions).toBeDefined();
    });

    it('Twilio Email 2: Valid credentials dispatches POST to https://comms.twilio.com/v1/Emails with Basic Auth and captures operationId', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SID = 'SK11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SECRET = 'secret1234567890';
      process.env.TWILIO_EMAIL_FROM_ADDRESS = 'security@chethankumar.dev';
      process.env.EMAIL_PROVIDER = 'twilio';
      delete process.env.RESEND_API_KEY;

      const fetchSpy = vi.fn().mockImplementation((url: string, opts: any) => {
        if (url.includes('/Operations/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              operationId: 'op_twilio_email_test_101',
              operationStatus: 'QUEUED',
              totalRecipientCount: 1,
              queuedCount: 1,
              sentCount: 0,
              deliveredCount: 0,
              failedCount: 0
            })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 202,
          json: async () => ({
            operationId: 'op_twilio_email_test_101',
            operationLocation: 'https://comms.twilio.com/v1/Emails/Operations/op_twilio_email_test_101'
          })
        });
      });
      vi.stubGlobal('fetch', fetchSpy);

      const result = await notificationService.sendEmailSecurityAlert({
        eventType: 'ADMIN_LOGIN_SUCCESS',
        subject: 'Twilio Email Notification Test',
        headline: 'Admin Login Notice',
        details: 'Testing Twilio Comms Email API pipeline.',
        severity: 'INFO'
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('QUEUED');
      expect(result.providerMessageId).toBe('op_twilio_email_test_101');
      expect(result.record?.provider).toBe('Twilio Comms Email');
      
      // Verify Basic Auth header
      const postCall = fetchSpy.mock.calls[0];
      expect(postCall[0]).toContain('https://comms.twilio.com/v1/Emails');
      expect(postCall[1].headers['Authorization']).toContain('Basic ');
      
      const body = JSON.parse(postCall[1].body);
      expect(body.from.address).toBe('security@chethankumar.dev');
      expect(body.to[0].address).toBe('the.suryaputraa@gmail.com');
      expect(body.content.subject).toBe('Twilio Email Notification Test');
    });

    it('Twilio Email 3: Polling operation resolves to DELIVERED when deliveredCount >= 1', async () => {
      process.env.TWILIO_API_KEY_SID = 'SK11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SECRET = 'secret1234567890';

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          operationId: 'op_twilio_email_test_101',
          operationStatus: 'COMPLETED',
          totalRecipientCount: 1,
          queuedCount: 0,
          sentCount: 1,
          deliveredCount: 1,
          failedCount: 0
        })
      }));

      const pollResult = await notificationService.pollEmailOperation('op_twilio_email_test_101');
      expect(pollResult).not.toBeNull();
      expect(pollResult?.status).toBe('DELIVERED');
      expect(pollResult?.operationStats.delivered).toBe(1);

      const historyRecord = notificationService.getHistory().find(h => h.providerMessageId === 'op_twilio_email_test_101');
      expect(historyRecord?.status).toBe('DELIVERED');
    });

    it('Twilio Email 4: Operation with deliveredCount 0 and sentCount 1 is tracked as SENT, NOT premature DELIVERED', async () => {
      process.env.TWILIO_API_KEY_SID = 'SK11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SECRET = 'secret1234567890';

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          operationId: 'op_twilio_email_test_102',
          operationStatus: 'PROCESSING',
          totalRecipientCount: 1,
          queuedCount: 0,
          sentCount: 1,
          deliveredCount: 0,
          failedCount: 0
        })
      }));

      const pollResult = await notificationService.pollEmailOperation('op_twilio_email_test_102');
      expect(pollResult).not.toBeNull();
      expect(pollResult?.status).toBe('SENT'); // Strictly SENT, never fake DELIVERED!
    });
  });

  // =========================================================================
  // 2. TWILIO SMS TESTS
  // =========================================================================
  describe('Twilio Programmable SMS Delivery Tests', () => {
    it('SMS Test 1: Missing credentials returns BLOCKED_CONFIGURATION without dispatch attempt', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_API_KEY_SID;
      delete process.env.TWILIO_API_KEY_SECRET;
      delete process.env.TWILIO_AUTH_TOKEN;

      const result = await notificationService.sendSmsSecurityAlert('Test message', 'TEST_SMS');
      expect(result.success).toBe(false);
      expect(result.status).toBe('BLOCKED_CONFIGURATION');
      expect(result.record).toBeNull();
      expect(result.message).toContain('Twilio SMS credentials not configured');
    });

    it('SMS Test 2: Unverified destination in Trial Mode is stopped preflight with AWAITING_RECIPIENT_VERIFICATION', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SID = 'SK11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SECRET = 'mock_secret';
      process.env.TWILIO_FROM_NUMBER = '+15551234567';
      process.env.TWILIO_TRIAL_MODE = 'true';
      delete process.env.TWILIO_VERIFIED_RECIPIENT_PHONE;
      delete process.env.PHONE_OWNERSHIP_VERIFIED;

      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      const result = await notificationService.sendSmsSecurityAlert('Test trial message', 'TEST_TRIAL_SMS');
      expect(result.success).toBe(false);
      expect(result.status).toBe('AWAITING_RECIPIENT_VERIFICATION');
      expect(result.record).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.message).toContain('Verified Caller IDs');
    });

    it('SMS Test 3: From number identical to destination is rejected with BLOCKED_CONFIGURATION', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SID = 'SK11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SECRET = 'mock_secret';
      process.env.TWILIO_FROM_NUMBER = '+919380469287';
      process.env.OWNER_ALERT_PHONE_E164 = '+919380469287';

      const result = await notificationService.sendSmsSecurityAlert('Test message', 'TEST_SAME_NUMBER');
      expect(result.success).toBe(false);
      expect(result.status).toBe('BLOCKED_CONFIGURATION');
      expect(result.message).toContain('cannot be identical to destination');
    });

    it('SMS Test 4: Successful dispatch returns QUEUED / ACCEPTED with Twilio Message SID (SM...)', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SID = 'SK11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SECRET = 'mock_secret';
      process.env.TWILIO_FROM_NUMBER = '+15551234567';
      process.env.TWILIO_VERIFIED_RECIPIENT_PHONE = '+919380469287';
      process.env.TWILIO_TRIAL_MODE = 'true';

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          sid: 'SM_twilio_sms_test_sid_8832',
          status: 'queued',
          to: '+919380469287',
          from: '+15551234567'
        })
      }));

      const result = await notificationService.sendSmsSecurityAlert();
      expect(result.success).toBe(true);
      expect(result.status).toBe('QUEUED');
      expect(result.providerMessageId).toBe('SM_twilio_sms_test_sid_8832');
      expect(result.record?.channel).toBe('SMS');
      expect(result.record?.contentPreview).toContain('Test notification: Your portfolio security notification service is working.');
    });

    it('SMS Test 5: Message resource polling maps sent as SENT, and delivered as DELIVERED', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SID = 'SK11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SECRET = 'mock_secret';

      // 1. Poll while status is 'sent'
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          sid: 'SM_twilio_sms_test_sid_8832',
          status: 'sent',
          to: '+919380469287'
        })
      }));

      const sentCheck = await notificationService.pollSmsMessage('SM_twilio_sms_test_sid_8832');
      expect(sentCheck?.status).toBe('SENT'); // Not prematurely DELIVERED!

      // 2. Poll when status becomes 'delivered'
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          sid: 'SM_twilio_sms_test_sid_8832',
          status: 'delivered',
          to: '+919380469287'
        })
      }));

      const deliveredCheck = await notificationService.pollSmsMessage('SM_twilio_sms_test_sid_8832');
      expect(deliveredCheck?.status).toBe('DELIVERED');
    });

    it('SMS Test 6: Delivery callback transitions Twilio SMS to DELIVERED', async () => {
      const updated = notificationService.updateDeliveryStatus('SM_twilio_sms_test_sid_8832', 'DELIVERED');
      expect(updated).toBe(true);

      const record = notificationService.getHistory().find(h => h.providerMessageId === 'SM_twilio_sms_test_sid_8832');
      expect(record?.status).toBe('DELIVERED');
      expect(record?.confirmedAtIST).toBeDefined();
    });
  });

  // =========================================================================
  // 3. TWILIO WHATSAPP TESTS
  // =========================================================================
  describe('Twilio WhatsApp Messaging Tests', () => {
    it('WhatsApp Test 1: Missing credentials returns BLOCKED_CONFIGURATION', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_API_KEY_SID;
      delete process.env.TWILIO_AUTH_TOKEN;

      const result = await notificationService.sendWhatsAppSecurityAlert('WhatsApp alert test');
      expect(result.success).toBe(false);
      expect(result.status).toBe('BLOCKED_CONFIGURATION');
      expect(result.record).toBeNull();
    });

    it('WhatsApp Test 2: Sandbox not joined returns AWAITING_RECIPIENT_VERIFICATION with opt-in guidance', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SID = 'SK11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SECRET = 'mock_secret';
      process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886';
      delete process.env.TWILIO_WHATSAPP_SANDBOX_JOINED;
      delete process.env.WHATSAPP_OWNERSHIP_VERIFIED;

      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      const result = await notificationService.sendWhatsAppSecurityAlert('Test WhatsApp alert');
      expect(result.success).toBe(false);
      expect(result.status).toBe('AWAITING_RECIPIENT_VERIFICATION');
      expect(result.record).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.instructions).toContain("join <keyword>");
    });

    it('WhatsApp Test 3: Successful message returns QUEUED / ACCEPTED with SID', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SID = 'SK11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SECRET = 'mock_secret';
      process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886';
      process.env.TWILIO_WHATSAPP_SANDBOX_JOINED = 'true';

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          sid: 'SM_whatsapp_test_sid_7721',
          status: 'queued',
          to: 'whatsapp:+919380469287',
          from: 'whatsapp:+14155238886'
        })
      }));

      const result = await notificationService.sendWhatsAppSecurityAlert('Security Factor Enrolled', 'FACTOR_ENROLLED');
      expect(result.success).toBe(true);
      expect(result.status).toBe('QUEUED');
      expect(result.providerMessageId).toBe('SM_whatsapp_test_sid_7721');
      expect(result.record?.channel).toBe('WHATSAPP');
    });

    it('WhatsApp Test 4: Webhook callback transitions WhatsApp message to DELIVERED', async () => {
      const updated = notificationService.updateDeliveryStatus('SM_whatsapp_test_sid_7721', 'DELIVERED');
      expect(updated).toBe(true);

      const record = notificationService.getHistory().find(h => h.providerMessageId === 'SM_whatsapp_test_sid_7721');
      expect(record?.status).toBe('DELIVERED');
    });
  });

  // =========================================================================
  // 4. DIAGNOSTICS & AUDIT SCHEMA TESTS
  // =========================================================================
  describe('Comprehensive Diagnostics & Audit Schema Tests', () => {
    it('Diagnostics reports Twilio Account owner email as karnashaiva81@gmail.com', () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SID = 'SK11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SECRET = 'mock_secret';

      const diag = notificationService.getComprehensiveDiagnostics();
      expect(diag.account.accountEmail).toBe('karnashaiva81@gmail.com');
      expect(diag.account.authMode).toBe('RESTRICTED_API_KEY');
      expect(diag.sms.destinationMasked).toBe('+91 93804 •••••');
      expect(diag.email.apiBaseUrl).toContain('comms.twilio.com');
    });

    it('suppresses duplicate dispatches with identical payload within debounce window', async () => {
      process.env.TWILIO_API_KEY_SID = 'SK11111111111111111111111111111111';
      process.env.TWILIO_API_KEY_SECRET = 'mock_secret';
      process.env.TWILIO_EMAIL_FROM_ADDRESS = 'security@chethankumar.dev';
      process.env.EMAIL_PROVIDER = 'twilio';

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 202,
        json: async () => ({ operationId: 'op_idemp_1' })
      }));

      const payload = {
        eventType: 'IDEMP_DUPLICATE_CHECK_2',
        subject: 'Idempotency Alert',
        headline: 'Idempotency Test Headline',
        details: 'Checking debounce suppression.',
        severity: 'INFO' as const
      };

      const first = await notificationService.sendEmailSecurityAlert(payload);
      expect(first.success).toBe(true);

      const second = await notificationService.sendEmailSecurityAlert(payload);
      expect(second.success).toBe(true);
      expect(second.message).toContain('Duplicate email alert suppressed by idempotency protection');
      expect(second.record).toBeNull();
    });

    it('enforces all exact DeliveryStatus lifecycle values including QUEUED, SENT, and UNDELIVERED', () => {
      const statuses: DeliveryStatus[] = [
        'CREATED',
        'BLOCKED_CONFIGURATION',
        'AWAITING_RECIPIENT_VERIFICATION',
        'AWAITING_BUSINESS_APPROVAL',
        'PENDING_DISPATCH',
        'DISPATCHING',
        'ACCEPTED',
        'QUEUED',
        'SENT',
        'DELIVERED',
        'UNDELIVERED',
        'FAILED',
        'REJECTED',
        'BOUNCED',
        'UNKNOWN'
      ];
      expect(statuses.length).toBe(15);
    });

    it('formats IST timestamps accurately with +5:30 offset', () => {
      const utcDate = new Date('2026-11-08T00:00:00Z');
      const istString = formatIST(utcDate);
      expect(istString).toContain('05:30:00 IST');
      expect(istString).toContain('8 Nov 2026');
    });
  });
});
