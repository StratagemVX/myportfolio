# Protected Environment Variables Specification & Security Demarcation

This document details all configuration parameters and secrets required for the production deployment of Chethan Kumar's Portfolio and Owner Security Centre, unified across **Twilio Comms Email**, **Twilio Programmable SMS**, and **Twilio WhatsApp**.

> [!CAUTION]
> **CRITICAL CREDENTIAL SECURITY:**
> The previously exposed Twilio Auth Token must be treated as **COMPROMISED**. Never use, commit, or log the old token. Prefer restricted Twilio API keys (`TWILIO_API_KEY_SID` + `TWILIO_API_KEY_SECRET`) over the primary account Auth Token. If an Auth Token is used, it must be the newly rotated token provided exclusively through deployment environment variables. Never prefix backend secrets with `VITE_`.

---

## 1. Client-Side Variables (Publicly Accessible in Bundle)

These variables carry the `VITE_` prefix and are safely bundled into client JavaScript. They must never contain secrets or credentials.

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_PORTFOLIO_ENV` | Optional | `production` | Environment mode (`development` or `production`) |
| `VITE_AUTH0_DOMAIN` | Optional | `your-tenant.us.auth0.com` | Auth0 tenant domain for PKCE Universal Login |
| `VITE_AUTH0_CLIENT_ID` | Optional | `your_spa_client_id` | Auth0 Single Page Application Client ID |
| `VITE_AUTH0_AUDIENCE` | Optional | `https://api.chethankumar.dev` | Auth0 API identifier for token audience validation |

---

## 2. Server-Side Protected Secrets (Never Exposed to Browser)

These variables are consumed exclusively by the backend API runtime (`/api/*`) and are protected from browser exposure.

### A. Primary Owner Notification Destinations & Account
| Variable Name | Channel | Configured Destination | Client Masking |
| :--- | :--- | :--- | :--- |
| `TWILIO_ACCOUNT_EMAIL` | Twilio Account | `karnashaiva81@gmail.com` | `k***@g***.com` |
| `OWNER_ALERT_EMAIL` | Email Alert Target | `owner@example.com` | `o***@e***.com` |
| `OWNER_ALERT_PHONE_E164` | SMS Alert Target | `+15550000000` | `+1 555 ••••••` |
| `OWNER_WHATSAPP_PHONE_E164` | WhatsApp Alert Target | `+15550000000` | `+1 555 ••••••` |

---

### B. Twilio Core Authentication & Credentials
| Variable Name | Required | Example | Purpose |
| :--- | :---: | :--- | :--- |
| `TWILIO_ACCOUNT_SID` | **Required** | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Twilio Account identifier |
| `TWILIO_API_KEY_SID` | **Preferred** | `SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Restricted Twilio API Key identifier |
| `TWILIO_API_KEY_SECRET` | **Preferred** | `[Twilio API Secret]` | Restricted Twilio API Key secret (HTTP Basic Auth) |
| `TWILIO_AUTH_TOKEN` | Fallback | `[Rotated Auth Token]` | Rotated Auth Token (Only if API Key not generated) |
| `TWILIO_TRIAL_MODE` | Optional | `true` / `false` | Enforces trial-mode checks (verified caller ID preflight) |

---

### C. Twilio Programmable SMS (India +91 & Trial Mode Aware)
| Variable Name | Required | Example | Purpose |
| :--- | :---: | :--- | :--- |
| `SMS_PROVIDER` | Optional | `twilio` | Active SMS provider |
| `TWILIO_FROM_NUMBER` | **Required** | `+1xxxxxxxxxx` | SMS-capable virtual phone number allocated in Twilio |
| `TWILIO_MESSAGING_SERVICE_SID` | Optional | `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Twilio Messaging Service SID (Alternative sender) |
| `OWNER_ALERT_PHONE_E164` | **Required** | `+15550000000` | Destination mobile in E.164 format |
| `TWILIO_VERIFIED_RECIPIENT_PHONE` | Optional | `+15550000000` | Confirms recipient is verified in Twilio Console |
| `PHONE_OWNERSHIP_VERIFIED` | Optional | `true` | Set to `true` once OTP is confirmed |
| `TWILIO_SMS_STATUS_CALLBACK_URL` | Optional | `http://localhost:3000/api/webhooks/twilio/sms` | Webhook URL for SMS delivery status callbacks |

---

### D. Twilio Comms Email API (Primary Transactional Email)
| Variable Name | Required | Example | Purpose |
| :--- | :---: | :--- | :--- |
| `EMAIL_PROVIDER` | Optional | `twilio` | Active email provider selector |
| `TWILIO_EMAIL_FROM_ADDRESS` | **Required** | `security@chethankumar.dev` | Authorized sender email address |
| `OWNER_ALERT_EMAIL` | **Required** | `owner@example.com` | Destination inbox for security alerts |
| `TWILIO_EMAIL_API_BASE_URL` | Optional | `https://comms.twilio.com/v1/Emails` | Twilio Comms Email REST endpoint |
| `TWILIO_EMAIL_WEBHOOK_URL` | Optional | `http://localhost:3000/api/webhooks/twilio/email` | Webhook URL for email event delivery receipts |
| `TWILIO_EMAIL_DOMAIN_VERIFIED` | Optional | `true` / `false` | Indicates whether custom domain DNS is verified |

---

### E. Twilio WhatsApp Messaging (Sandbox / Registered Sender)
| Variable Name | Required | Example | Purpose |
| :--- | :---: | :--- | :--- |
| `WHATSAPP_PROVIDER` | Optional | `twilio` | Consolidated WhatsApp provider |
| `TWILIO_WHATSAPP_FROM` | **Required** | `whatsapp:+14155238886` | Twilio WhatsApp Sandbox number or approved Sender |
| `OWNER_WHATSAPP_PHONE_E164` | **Required** | `+15550000000` | Destination WhatsApp number in E.164 format |
| `TWILIO_WHATSAPP_SANDBOX_JOINED` | Optional | `true` / `false` | Confirms recipient texted `join <keyword>` to Sandbox |
| `TWILIO_WHATSAPP_STATUS_CALLBACK_URL` | Optional | `http://localhost:3000/api/webhooks/twilio/whatsapp` | Webhook URL for WhatsApp delivery receipts |

---

## 3. Environment Template (`.env.example`)

```bash
TWILIO_ACCOUNT_SID=
TWILIO_API_KEY_SID=
TWILIO_API_KEY_SECRET=

# SMS
TWILIO_FROM_NUMBER=
TWILIO_MESSAGING_SERVICE_SID=
OWNER_ALERT_PHONE_E164=+15550000000
TWILIO_SMS_STATUS_CALLBACK_URL=http://localhost:3000/api/webhooks/twilio/sms

# EMAIL
TWILIO_EMAIL_FROM_ADDRESS=security@chethankumar.dev
OWNER_ALERT_EMAIL=owner@example.com
TWILIO_EMAIL_API_BASE_URL=https://comms.twilio.com/v1/Emails

# EMAIL STATUS
TWILIO_EMAIL_WEBHOOK_URL=http://localhost:3000/api/webhooks/twilio/email

# WHATSAPP
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
OWNER_WHATSAPP_PHONE_E164=+15550000000
TWILIO_WHATSAPP_STATUS_CALLBACK_URL=http://localhost:3000/api/webhooks/twilio/whatsapp
```
