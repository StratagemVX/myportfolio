# Account Recovery & Incident Response Protocols

## 1. Principles of Account Recovery

1. **Zero Unauthenticated Backdoors:** There is no master password, bypass query parameter, or client-side toggle that circumvents administrative authentication.
2. **Mandatory MFA Continuity:** Resetting a password never disables or skips multi-factor authentication. Subsequent sign-ins strictly require an enrolled factor (TOTP or Passkey) or an emergency recovery code.
3. **Out-of-Band Channel Separation:** Recovery communications are directed exclusively to the verified security recovery email: `the.suryaputraa@gmail.com`.

---

## 2. Failure Mode Recovery Scenarios

### Scenario A: Forgotten Administrator Passphrase
1. Navigate to the **Administrator Security Gate** at `/admin`.
2. Click **Forgot Passphrase?**.
3. Submit the verified account email (`the.suryaputraa@gmail.com`).
4. The server dispatches an Auth0 password-reset notification with anti-enumeration protection.
5. Follow the single-use expiring reset link to establish a new password.
6. Return to `/admin` and sign in. Complete the mandatory secondary MFA challenge (Authenticator app or Passkey).

---

### Scenario B: Lost Authenticator Device (Phone Damaged or Replaced)
1. At the **Multi-Factor Challenge** screen, switch to the **Backup Code** tab.
2. Enter one of your 10 single-use emergency recovery codes (`XXXX-XXXX-XXXX-XXXX`).
3. The server computes the SHA-256 hash of the entered code, verifies it against the active hashed table, and permanently marks that code as consumed.
4. A critical security alert is dispatched immediately to `the.suryaputraa@gmail.com` and SMS `+919380469287`.
5. Once inside **Account & Security -> Authenticator Apps**:
   - Re-enroll a new authenticator application by scanning the fresh QR code.
   - Navigate to **Recovery Methods** and select **Regenerate 10 Recovery Codes** to invalidate previous backup codes and refresh your offline reserve.

---

### Scenario C: Lost Biometric Sensor or Hardware Passkey
1. At the **Multi-Factor Challenge** screen, select the **Authenticator** tab.
2. Submit your 6-digit TOTP code from Google or Microsoft Authenticator.
3. Once logged in, navigate to **Account & Security -> Passkeys & FIDO2**.
4. Identify the lost key by its device label and select **Revoke**.
5. Enroll a new biometric passkey or security key using the **Enrol Passkey** workflow.

---

### Scenario D: Simultaneous Loss of Authenticator, Passkeys, and Backup Codes
If all enrolled factors and offline recovery codes have been destroyed:

1. **Auth0 Tenant Direct Intervention:**
   - Log into the [Auth0 Management Dashboard](https://manage.auth0.com) using your root tenant credentials and separate identity provider MFA.
   - Navigate to **User Management -> Users**.
   - Locate user `the.suryaputraa@gmail.com`.
   - Access **Multi-Factor Authentication** tab and trigger **Reset Multi-Factor Authentication**.
   - Auth0 will send a secure identity re-enrollment invitation to `the.suryaputraa@gmail.com`.
2. **Re-enrollment Protocol:**
   - Sign into the portfolio with your primary credentials.
   - The platform will prompt an immediate, mandatory MFA enrollment sequence.
   - Scan the new TOTP QR code and immediately print fresh recovery backup codes.
