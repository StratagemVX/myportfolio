# Transactional Email Delivery Setup & Domain Verification

This guide explains how to configure a genuine transactional email delivery provider for Chethan Kumar's portfolio security subsystem.

---

## 1. Supported Providers

The portfolio security backend supports four transactional delivery engines with automatic fallback:

1. **Resend** (Recommended — Fast REST API with detailed webhooks)
2. **SendGrid** (Enterprise standard REST API)
3. **Postmark** (High-deliverability transactional engine)
4. **Direct SMTP via Nodemailer** (Compatible with Amazon SES, Google Workspace SMTP Relay, ProtonMail Bridge, or self-hosted servers)

---

## 2. Recommended: Resend Configuration

### Step 1: Create an Account & Generate API Key
1. Sign up at [resend.com](https://resend.com/).
2. Navigate to **API Keys** > **Create API Key**.
3. Name: `Portfolio Security Alerts` with Full Access or Sending Access.
4. Copy the API key (format: `re_xxxxxxxxxxxx`).

### Step 2: Add Domain in Resend
1. Navigate to **Domains** > **Add Domain**.
2. Enter your domain: `chethankumar.dev`.
3. Resend will provide DNS records:
   - **DKIM:** Three `CNAME` records (`resend._domainkey...`)
   - **SPF:** One `TXT` record: `v=spf1 include:amazonses.com ~all`
   - **DMARC:** One `TXT` record: `_dmarc.chethankumar.dev` with value `v=DMARC1; p=reject; rua=mailto:security@chethankumar.dev`
4. Add these records in your DNS provider (Cloudflare, Vercel, or Namecheap).
5. Click **Verify Domain**.

### Step 3: Configure Server Environment Variables
In your local `.env` or Vercel project settings:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=security@chethankumar.dev
OWNER_ALERT_EMAIL=the.suryaputraa@gmail.com
```

---

## 3. Alternative: SendGrid Configuration

If using SendGrid:
1. Create an API Key in SendGrid Dashboard with **Mail Send** permissions.
2. Complete **Sender Authentication** for `chethankumar.dev`.
3. Set environment variables:
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=security@chethankumar.dev
   OWNER_ALERT_EMAIL=the.suryaputraa@gmail.com
   ```

---

## 4. Alternative: Custom SMTP (Nodemailer)

If using SMTP relay (e.g., Google Workspace, Amazon SES SMTP, or Zoho):
```bash
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_SECURE=false
EMAIL_FROM=security@chethankumar.dev
OWNER_ALERT_EMAIL=the.suryaputraa@gmail.com
```

---

## 5. Testing & Verification

1. Log into your portfolio administration dashboard at `http://localhost:3000/admin`.
2. Navigate to **Account & Security** > **Notifications**.
3. Under the **Email Security Alerts** panel:
   - Check the provider status badge. If keys are missing, it will accurately state `CONFIGURATION REQUIRED`.
   - Once keys are saved and server reloaded, the badge updates to `READY`.
4. Click **Send Test Email**:
   - The server dispatches a diagnostic security email to `OWNER_ALERT_EMAIL`.
   - The response status displays `ACCEPTED` with the provider's reference message ID (e.g. `res_abc123`).
   - Check your inbox at `the.suryaputraa@gmail.com`.
