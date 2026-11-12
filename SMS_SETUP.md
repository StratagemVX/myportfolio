# Twilio SMS Security Alerts & India Regulatory Setup

This guide explains how to configure Twilio SMS alerts for Chethan Kumar's portfolio, with specific focus on international and India (+91) carrier regulations.

---

## 1. Prerequisites

1. Active account at [twilio.com](https://www.twilio.com/).
2. Twilio Account SID and Auth Token.
3. An SMS-enabled Twilio phone number or Messaging Service SID.

---

## 2. Server Configuration

Add the following environment variables to your server configuration:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
# Or if using a Messaging Service:
# TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

OWNER_ALERT_PHONE_E164=+15550000000
```

---

## 3. India (+91) Regulatory Compliance (TRAI / DLT)

In India, the Telecom Regulatory Authority of India (TRAI) enforces Distributed Ledger Technology (DLT) registration for commercial and transactional SMS messages:

### Why India Regulatory Compliance Matters:
- Messages sent to Indian numbers (`+91`) without registered DLT headers and templates are subject to carrier blocking or filtering by telecom operators (Airtel, Jio, Vi, BSNL).
- **International Shortcode / Longcode:** Sending from standard international numbers (e.g. US +1 numbers) to Indian recipients works for low-volume personal alerts, but may experience carrier delivery latency or spam filtering.

### Production DLT Registration Steps (For Scaled Delivery):
1. **Register as Principal Entity:** On a DLT portal (e.g., Vilpower / Jio DLT / Airtel DLT).
2. **Register Sender Header:** Reserve your alphanumeric sender ID (e.g., `CHETHN`).
3. **Register Content Template:**
   - Template Category: **Service Implicit** / **Transactional**
   - Sample Template text:
     ```
     [CHETHAN PORTFOLIO] Security Alert: {#var#} occurred at {#var#}. If unauthorized, access https://chethankumar.dev/admin
     ```
4. **Link to Twilio:** Submit your registered PE ID and Template ID to Twilio Support under India SMS regulations.

---

## 4. Phone Ownership Verification Protocol

To prevent accidental dispatch to unverified numbers:
1. In the **Account & Security** > **Notifications** dashboard, the mobile card displays a **Verify Ownership** button.
2. Clicking **Verify Ownership** generates a cryptographic 6-digit OTP code sent via SMS.
3. Enter the code in the confirmation modal.
4. Upon successful validation, the status updates to `VERIFIED NUMBER` and activates security dispatches.

---

## 5. Testing Twilio SMS

1. Open **Account & Security** > **Notifications**.
2. If credentials are missing, the status displays `AWAITING CREDENTIALS`.
3. With valid credentials, click **Send Test SMS**.
4. The server calls the Twilio REST API and returns `ACCEPTED` with the Twilio Message SID (e.g., `SMxxxxxxxxxxxx`).
