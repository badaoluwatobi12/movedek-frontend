# MoveDek — Resend Email and Real Document Upload Completion

## Scope completed

This release updates the latest standalone backend and frontend repositories.
It does not depend on the older combined Phase 3 archive.

### Resend email

- Durable PostgreSQL email outbox with retries, stale-lock recovery, provider
  message IDs, delivery status, and idempotency keys.
- Resend provider integration through the server-side API.
- Background email worker with graceful startup and shutdown.
- Signed Resend webhook endpoint using the raw request body and Svix headers.
- Delivery states for sent, delivered, delayed, bounced, complained,
  suppressed, and failed messages.
- Welcome email after registration.
- Secure forgot-password and one-time reset-token flow.
- Courier onboarding-submitted, approval, and rejection emails.
- Email delivery for in-app notifications when the user allows email
  notifications.
- Admin test-email endpoint and `/admin/email` dashboard for delivery status.
- HTML escaping in email templates.

### Real courier documents

- Real multipart upload from courier onboarding.
- JPEG, PNG, WebP, and PDF support.
- Configurable 8 MB default limit.
- MIME-type and magic-byte validation.
- Server-signed Cloudinary upload.
- Cloudinary `authenticated` delivery type for identity documents.
- PostgreSQL metadata table with one active file per courier/document type.
- Secure backend access for the owning courier or authorized admin only.
- Protected inline viewing and download.
- Replace and delete handling with provider cleanup.
- Courier status automatically returns to pending after a document changes.
- Admin approval blocked until required real documents exist.
- Document review status and rejection reasons.
- Actual document upload and review interfaces in the web app.

## New migration

```text
026_create_email_and_verification_documents.sql
```

It creates:

- `movedek_email_deliveries`
- `movedek_password_reset_tokens`
- `movedek_verification_documents`

Run migrations before starting the new backend.

## Required Render configuration

Build command:

```bash
corepack prepare pnpm@11.15.0 --activate && corepack pnpm install --frozen-lockfile && corepack pnpm run build
```

Pre-deploy command:

```bash
corepack pnpm run db:migrate
```

Start command:

```bash
node dist/server.js
```

Node:

```env
NODE_VERSION=22.23.1
```

### Resend

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_YOUR_PRIVATE_API_KEY
EMAIL_FROM=MoveDek <notifications@movedek.com>
EMAIL_REPLY_TO=support@movedek.com
EMAIL_WORKER_ENABLED=true
EMAIL_POLL_INTERVAL_MS=5000
PASSWORD_RESET_TTL_MINUTES=30
RESEND_WEBHOOK_ENABLED=true
RESEND_WEBHOOK_SECRET=whsec_YOUR_PRIVATE_SIGNING_SECRET
```

Webhook URL:

```text
https://api.movedek.com/api/webhooks/resend
```

Webhook events:

```text
email.sent
email.delivered
email.delivery_delayed
email.bounced
email.complained
email.suppressed
email.failed
```

### Cloudinary

```env
FILE_UPLOADS_ENABLED=true
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_PRIVATE_API_SECRET
MAX_UPLOAD_BYTES=8000000
DOCUMENT_ACCESS_TTL_SECONDS=300
```

## Main API routes

```text
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/admin/email-deliveries
POST /api/admin/email/test
POST /api/webhooks/resend

GET    /api/couriers/documents/me
POST   /api/couriers/documents/me/:type
GET    /api/couriers/documents/courier/:courierId
GET    /api/couriers/documents/:id/access
DELETE /api/couriers/documents/:id
```

The upload field name is `document`.

## Web application routes

```text
/auth/forgot
/auth/reset?token=...
/courier/onboarding
/admin/couriers/:id
/admin/email
```

## Verification completed

| Check | Result |
|---|---:|
| Backend formatting | Passed |
| Backend strict TypeScript | Passed |
| Backend ESLint | Passed |
| Backend tests | 112 passed, 1 PostgreSQL test skipped locally |
| Backend production build | Passed |
| Frontend formatting | Passed |
| Frontend strict TypeScript | Passed |
| Frontend ESLint | Passed |
| Frontend tests | 13/13 passed |
| Frontend production build | Passed |
| Source secret scan | No real Resend or Cloudinary secrets found |

The skipped integration test requires a real `TEST_DATABASE_URL`; it remains
configured for PostgreSQL execution. External Resend delivery and Cloudinary
storage could not be live-tested without using the user's private production
credentials.

## Production test sequence

1. Deploy the backend and run migration 026.
2. Confirm `/health/live` and `/health/ready` return HTTP 200.
3. Add the Resend webhook and signing secret.
4. Open `/admin/email` and send a test message to an address you control.
5. Confirm the outbox changes from `queued` to `sent`, then `delivered` after
   the webhook arrives.
6. Upload dummy courier files first.
7. Confirm the courier can view only their own documents.
8. Confirm an admin can view the documents and approve the courier.
9. Confirm another ordinary user cannot access the document endpoint.
10. Only then begin a controlled real-document pilot.

## Remaining identity-document controls

This release provides private storage, authorization, audit linkage, file-type
validation, and admin review. It does not yet provide malware scanning, OCR,
biometric face matching, or a third-party KYC decision. Before collecting real
IDs, publish the privacy notice and define retention, deletion, staff access,
and incident-response procedures.
