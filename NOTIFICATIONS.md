# Multi-Channel Security Notification Architecture

## 1. Overview

The portfolio incorporates an enterprise out-of-band notification engine that dispatches real-time alerts across **Email**, **SMS**, and **WhatsApp Business** for all security-sensitive events.

---

## 2. Verified Delivery Destinations

| Channel | Target Destination | Status Requirement | Primary Role |
| :--- | :--- | :--- | :--- |
| **Email** | `the.suryaputraa@gmail.com` | Pre-verified owner inbox | Primary alert channel, password OTP delivery, Auth0 reset links |
| **SMS** | `+919380469287` | Requires 6-digit ownership verification OTP | Secondary out-of-band alerts for critical security events |
| **WhatsApp** | `+919380469287` | Requires 6-digit ownership verification OTP | Urgent notifications via Meta WhatsApp Business Cloud API |

> [!NOTE]
> SMS and WhatsApp are notification channels only. They are never utilized as the sole authentication or recovery factor.

---

## 3. Trigger Events & Escalation Matrix

| Security Event | Email Alert | SMS Alert | WhatsApp Alert | Severity |
| :--- | :---: | :---: | :---: | :--- |
| **Successful Administrator Login** | Always (Default) | Optional | Optional | `INFO` |
| **Login from Unfamiliar Device / IP** | Always | Optional | Optional | `WARNING` |
| **Repeated Failed Login Attempts** | Always | Enabled | Enabled | `WARNING` |
| **Password Change Confirmation Code** | Always (OTP) | Never | Never | `WARNING` |
| **Password Reset Completed** | Always | Enabled | Enabled | `CRITICAL` |
| **Login Email Address Changed** | Always (Dual) | Enabled | Enabled | `CRITICAL` |
| **Authenticator (TOTP) Enrolled / Revoked** | Always | Optional | Optional | `WARNING` |
| **Passkey (FIDO2) Enrolled / Revoked** | Always | Optional | Optional | `WARNING` |
| **Emergency Recovery Code Consumed** | Always | Enabled | Enabled | `CRITICAL` |
| **Emergency Recovery Codes Regenerated** | Always | Optional | Optional | `WARNING` |
| **All Other Sessions Terminated** | Always | Optional | Optional | `INFO` |
| **Private Recruiter Token Issued / Revoked** | Always | Optional | Optional | `INFO` |

---

## 4. Email Template Specification

All email notifications follow strict security hygiene:

```
Subject: Portfolio Admin — Successful Login
From: security@chethankumar.dev
To: the.suryaputraa@gmail.com

[CHETHAN KUMAR PORTFOLIO SECURITY DISPATCH]
Successful Administrator Login Detected

An administrator login was completed for your portfolio account.

Event Details:
- Event Type: ADMIN_LOGIN_SUCCESS
- Timestamp: 8 Nov 2026, 00:25:30 IST
- IP Address: 127.0.0.1 (Local Workstation)
- Browser / Agent: Google Chrome 131.0 (Windows 11 NT)
- Outcome: Successful (MFA Factor: Authenticator App)

If you did not initiate this action, immediately review and secure your account:
https://chethankumar.dev/admin
```

### Payload Hygiene Guidelines
- **Zero Secrets in Plaintext:** Never send passwords, TOTP secret keys, or emergency recovery codes via SMS or WhatsApp.
- **No Sensitive URLs in SMS/WhatsApp:** Password reset links are delivered strictly to the verified email inbox.
- **Subject Line Cleanliness:** Email subjects avoid disclosing private credentials or specific user IDs.

---

## 5. Provider Integration Configurations

### A. Email Providers
- **Resend:** Configure `RESEND_API_KEY` and `EMAIL_FROM`. Uses HTTPS REST API.
- **SendGrid:** Configure `SENDGRID_API_KEY`.
- **SMTP:** Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
- **Simulated Secure Queue:** When credentials are not yet configured, messages are buffered to `server/notifications-log.json` and rendered in the Admin Security Activity log.

### B. Twilio SMS Gateway
- Requires: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
- Dispatches via Twilio Messages REST API.

### C. Meta WhatsApp Business Cloud API
- Requires: `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, approved Meta template.
- Sends business-initiated security alerts to verified target `+919380469287`.
