# WhatsApp Business API Security Alerts Setup

This guide details the integration and verification process for Meta WhatsApp Cloud API and Twilio WhatsApp messaging for Chethan Kumar's portfolio.

---

## 1. Supported WhatsApp Gateways

The backend supports two WhatsApp delivery engines:
1. **Meta WhatsApp Cloud API (Official Graph API v19.0)** — Direct connection to Meta's servers.
2. **Twilio WhatsApp Business** — Managed gateway with sandbox testing support.

---

## 2. Meta WhatsApp Cloud API Setup

### Step 1: Create a Meta for Developers Account
1. Visit [developers.facebook.com](https://developers.facebook.com/) and register as a developer.
2. Click **My Apps** > **Create App**.
3. Select **Other** > Choose **Business** as the app type.
4. Name your app: `Portfolio Security Notifier`.

### Step 2: Add WhatsApp Product
1. Under **Add products to your app**, locate **WhatsApp** and click **Set up**.
2. You will be provided with:
   - A **Test Phone Number ID**
   - A **WhatsApp Business Account ID**
   - A temporary **Access Token** (valid for 24 hours)

### Step 3: Create Permanent System User Token
For uninterrupted production alerts:
1. Go to **Meta Business Suite** > **Business Settings**.
2. Under **Users**, select **System Users** > Click **Add**.
3. Name: `Portfolio Admin Dispatcher` with role **Admin**.
4. Generate token with permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Save this token securely as `WHATSAPP_API_TOKEN`.

### Step 4: Register Business Phone & Domain Verification
1. To send messages outside Meta's test sandbox to your personal mobile (`+15550000000`), verify your business identity and add your official phone number.
2. Until Meta completes business verification, the portfolio dashboard accurately reports the status as:
   `PENDING_BUSINESS_APPROVAL`

---

## 3. Pre-Approved WhatsApp Message Templates

WhatsApp Business requires pre-approved message templates for business-initiated notifications:

### Security Alert Template Definition:
- **Template Name:** `portfolio_security_alert`
- **Category:** `AUTHENTICATION` or `UTILITY`
- **Language:** `en_US`
- **Header:** `Portfolio Security Alert`
- **Body:**
  ```
  Security alert for Chethan Kumar Portfolio.
  Event: {{1}}
  Timestamp: {{2}}
  Device / Location: {{3}}
  If this was not you, review your account security immediately: https://chethankumar.dev/admin
  ```
- **Button:** Quick reply or URL: `Open Security Center`

---

## 4. Alternative: Twilio WhatsApp Sandbox

For fast local testing without waiting for Meta business verification:
1. In Twilio Console, open **Messaging** > **Try it out** > **Send a WhatsApp message**.
2. Follow instructions to join your sandbox by sending `join <sandbox-word>` from your phone (`+15550000000`) to the Twilio number.
3. Configure environment variables:
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   OWNER_WHATSAPP_PHONE_E164=+15550000000
   ```

---

## 5. Environment Variables Summary

```bash
WHATSAPP_API_TOKEN=EAA...your_system_user_token
WHATSAPP_PHONE_NUMBER_ID=10xxxxxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=10xxxxxxxxxxxxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=portfolio-security-webhook
OWNER_WHATSAPP_PHONE_E164=+15550000000
```
