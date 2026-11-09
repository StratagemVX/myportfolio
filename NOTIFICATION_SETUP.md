# Multi-Channel Security Notification Infrastructure Guide

This operational manual documents the production-grade notification infrastructure for Chethan Kumar's Portfolio Owner Account Security Centre, powered by **Twilio Comms Email**, **Twilio Programmable Messaging** (SMS with Trial Mode & India +91 awareness), and **Twilio WhatsApp** (Sandbox & Business Messaging).

> [!CAUTION]
> **CRITICAL CREDENTIAL SECURITY:**
> The previously exposed Twilio Auth Token must be treated as **COMPROMISED**.
> 1. Never reproduce, commit, or log the old compromised Auth Token.
> 2. Rotate the primary Auth Token immediately in the Twilio Console.
> 3. Prefer restricted Twilio API keys (`TWILIO_API_KEY_SID` + `TWILIO_API_KEY_SECRET`) using HTTP Basic auth over the primary Account Auth Token.
> 4. Do not paste secret API keys into chat or AI agent prompts. Always set credentials in deployment environment settings.

---

## 1. Verified Destination Targets & Account Identifiers

All notification targets and account credentials are resolved exclusively server-side from environment variables and are never bundled into client JavaScript. Client-side dashboard interfaces display cryptographically masked destinations for privacy:

| Entity | Identifier / Destination | Environment Variable | Dashboard Masked Display |
|---|---|---|---|
| **Twilio Account Owner** | `karnashaiva81@gmail.com` | `TWILIO_ACCOUNT_EMAIL` | `k***@g***.com` |
| **Alert Destination Email** | `the.suryaputraa@gmail.com` | `OWNER_ALERT_EMAIL` | `t***@g***.com` |
| **SMS Alert Target** | `+919380469287` | `OWNER_ALERT_PHONE_E164` | `+91 93804 •••••` |
| **WhatsApp Alert Target** | `+919380469287` | `OWNER_WHATSAPP_PHONE_E164` | `+91 93804 •••••` |
| **Audit Timezone** | `Asia/Kolkata` (IST, UTC+5:30) | System Default | e.g. `08 Nov 2026, 02:30:00 IST` |

---

## 2. Truthful Delivery Lifecycle & Real Status Tracking

The notification subsystem **never simulates delivery** and **never claims `DELIVERED` upon upstream API request acceptance**. The system tracks every event through explicit provider-reported states:

```
┌─────────┐
│ CREATED │
└────┬────┘
     │
     ├──► [Missing credentials] ────────────────► BLOCKED_CONFIGURATION
     │
     ├──► [Trial account & unverified number] ──► AWAITING_RECIPIENT_VERIFICATION
     │
     ├──► [Sandbox opt-in keyword pending] ────► AWAITING_RECIPIENT_VERIFICATION
     │
     ├──► [Meta/Twilio business review] ────────► AWAITING_BUSINESS_APPROVAL
     │
     ▼
┌──────────────────┐
│ PENDING_DISPATCH │
└────┬─────────────┘
     ▼
┌─────────────┐
│ DISPATCHING │
└────┬────────┘
     │
     ├──► [Upstream HTTP 202/201 response] ────► QUEUED / ACCEPTED (with SID / Operation ID)
     │                                                │
     │                                                ├──► [Polling/Webhook: Sent to carrier] ────► SENT (Awaiting device receipt)
     │                                                ├──► [Polling/Webhook: Device confirmed] ──► DELIVERED
     │                                                ├──► [Polling/Webhook: Carrier rejected] ──► UNDELIVERED / FAILED
     │                                                └──► [Webhook: Mailbox rejected] ──────────► BOUNCED
     │
     ├──► [Auth error / unverified domain] ────► REJECTED
     │
     └──► [Carrier reject / Network error] ────► FAILED
```

| Lifecycle Status | Description | UI Badge |
|---|---|---|
| `CREATED` | Notification record initialized with unique Event ID & Idempotency Key. | Slate Badge |
| `BLOCKED_CONFIGURATION` | Missing credentials or unconfigured provider in server environment. No wire dispatch attempted. | Amber Badge |
| `AWAITING_RECIPIENT_VERIFICATION` | Recipient destination (`+919380469287`) requires verification in Twilio Console or WhatsApp Sandbox opt-in. | Amber Badge |
| `AWAITING_BUSINESS_APPROVAL` | WhatsApp sender or Business Manager identity verification pending review by provider. | Indigo Badge |
| `PENDING_DISPATCH` | Notification queued and preflight validation passed; preparing network request. | Sky Badge |
| `DISPATCHING` | Asynchronous HTTP request in flight to provider REST endpoint. | Cyan Pulse Badge |
| `QUEUED` | Request accepted into Twilio messaging or email pipeline. Delivery unconfirmed. | Amber Badge |
| `ACCEPTED` | Provider acknowledged request with SID or operation ID. Delivery unconfirmed. | Cyan Badge |
| `SENT` | Carrier or MTA accepted message from Twilio. Awaiting destination handset receipt. | Sky Badge |
| `DELIVERED` | Handset receipt confirmed by carrier delivery receipt or email inbox delivery callback. | Sage Green Badge |
| `UNDELIVERED` | Destination carrier reported handset unable to receive SMS (e.g. absent subscriber). | Red Badge |
| `FAILED` | Provider returned error code, sender unconfigured, or network timeout encountered. | Red Badge |
| `REJECTED` | Provider rejected message due to invalid credentials, unverified domain, or trial block. | Orange Badge |
| `BOUNCED` | Recipient mail exchanger bounced message (e.g. 550 Mailbox unavailable). | Rose Badge |
| `UNKNOWN` | Status cannot be determined; awaiting status callback or query. | Zinc Badge |

---

## 3. Provider Integration Specifications

### A. Twilio Programmable SMS API Pattern
- **Endpoint:** `POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`
- **Authentication:** `Authorization: Basic base64(TWILIO_API_KEY_SID:TWILIO_API_KEY_SECRET)`
- **Request Form Fields:**
  - `To`: `+919380469287`
  - `From`: `TWILIO_FROM_NUMBER` (or `MessagingServiceSid`: `TWILIO_MESSAGING_SERVICE_SID`)
  - `Body`: Notification alert or test message
  - `StatusCallback`: `https://<domain>/api/webhooks/twilio/sms`
- **Polling Fallback:** `GET https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages/{MessageSid}.json`
- **Test Message:** `"Test notification: Your portfolio security notification service is working."`

### B. Twilio Comms Email API Pattern
- **Endpoint:** `POST https://comms.twilio.com/v1/Emails`
- **Authentication:** `Authorization: Basic base64(TWILIO_API_KEY_SID:TWILIO_API_KEY_SECRET)`
- **JSON Request Format:**
  ```json
  {
    "from": {
      "address": "security@chethankumar.dev",
      "name": "Portfolio Security"
    },
    "to": [
      {
        "address": "the.suryaputraa@gmail.com"
      }
    ],
    "content": {
      "subject": "Portfolio Security Notification",
      "html": "<p>This is a test notification from your portfolio security system.</p>"
    }
  }
  ```
- **Response:** HTTP 202 Accepted with `operationId` and `operationLocation`.
- **Operation Tracking:** `GET https://comms.twilio.com/v1/Emails/Operations/{operationId}`
- **Delivery Proof Rule:** Only `deliveredCount >= 1` or an authorized webhook callback marks the record `DELIVERED`. An accepted 202 or `operationStatus: COMPLETED` alone is not treated as proof of inbox delivery.

### C. Twilio WhatsApp Messaging Pattern
- **Endpoint:** `POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`
- **Sender Address:** `whatsapp:+14155238886` (Sandbox) or approved Business Sender
- **Recipient Address:** `whatsapp:+919380469287`
- **Sandbox Requirement:** Recipient must send `join <keyword>` from `+919380469287` to `+1 415 523 8886` before messages can be delivered.

---

## 4. Manual Configuration Runbook

### Step 1: Rotate Auth Token in Twilio Console
1. Log into [Twilio Console](https://console.twilio.com) with `karnashaiva81@gmail.com`.
2. Under **Account Info**, locate **Auth Token**.
3. Select **Rotate Auth Token**. Revoke the compromised token and keep the newly rotated secret confidential.

### Step 2: Generate Restricted API Key (Best Practice)
1. In Twilio Console, go to **Account > API keys & tokens**.
2. Click **Create API key**. Name it `portfolio-security-key`.
3. Save the Key SID (`SK...`) and Secret.
4. Set `TWILIO_API_KEY_SID` and `TWILIO_API_KEY_SECRET` in your server environment.

### Step 3: Verify Destination Phone Number (Trial Mode Requirement)
Because the Twilio account is a Trial account:
1. Go to **Phone Numbers > Manage > Verified Caller IDs**.
2. Click **Add a new Caller ID**.
3. Enter `+919380469287` and select SMS verification.
4. Enter the 6-digit code received on your phone.
5. In your environment, set `TWILIO_VERIFIED_RECIPIENT_PHONE=+919380469287` and `PHONE_OWNERSHIP_VERIFIED=true`.

### Step 4: Enable India Geographic Permissions
1. Navigate to **Messaging > Settings > Geo-Permissions**.
2. Search for **India (+91)**.
3. Ensure the checkbox for India is checked. Click **Save**.

### Step 5: Join Twilio WhatsApp Sandbox
1. Go to **Messaging > Try it out > Send a WhatsApp message**.
2. Note your sandbox join code (e.g., `join <keyword>`).
3. From `+919380469287`, open WhatsApp and send that exact message to `+1 415 523 8886`.
4. Wait for the confirmation reply from Twilio Sandbox.
5. In your environment, set `TWILIO_WHATSAPP_SANDBOX_JOINED=true`.

---

## 5. Webhook Configuration

Configure the following StatusCallback URLs in your Twilio Console or Messaging Service:

| Channel | Callback URL | HTTP Method | Payload Format |
|---|---|---|---|
| **SMS Status Callback** | `https://<your-domain>/api/webhooks/twilio/sms` | `POST` | `application/x-www-form-urlencoded` |
| **Email Status Callback** | `https://<your-domain>/api/webhooks/twilio/email` | `POST` | `application/json` |
| **WhatsApp Status Callback** | `https://<your-domain>/api/webhooks/twilio/whatsapp` | `POST` | `application/x-www-form-urlencoded` |
| **Resend (Fallback)** | `https://<your-domain>/api/webhooks/resend` | `POST` | `application/json` |
