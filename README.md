# Girl Math on Cloudflare (free tier)

This is the Cloudflare implementation. It requires Workers, D1 and Cloudflare Access configured for a single owner. It fails closed if Cloudflare Access has not authenticated the request or the authenticated email differs from `OWNER_EMAIL`. It is not ready for real data until that access policy is configured and independently verified.

The Worker uses D1 for transaction history, corrections and sync cursors. Plaid access tokens are AES-GCM encrypted with the server-side `TOKEN_KEY`; the Plaid secret and encryption key are Worker secrets. The scheduled Worker syncs every six hours. Cloudflare holds the data and secrets. Data are protected in transit; access tokens are additionally encrypted before database storage. Protect the encryption key and backups: losing it prevents the app from decrypting stored access tokens. If a secret is exposed, rotate or revoke it.

## Setup outline

1. Create a Cloudflare account and select Workers Free. Install Wrangler from its official package or use a current `npx wrangler`. No paid services are required by this design. Configure a workers.dev subdomain. Enable Zero Trust Free and set up a one-time PIN or identity provider for your own email.
2. Copy `wrangler.example.jsonc` to `wrangler.jsonc` (ignored by Git). Create D1 database `girl-math`, put its returned database ID in that file, and apply `migrations/0001_init.sql` using Wrangler's D1 migration command.
3. Set Worker secrets `PLAID_CLIENT_ID`, `PLAID_SECRET`, `TOKEN_KEY` and `OWNER_EMAIL`. `TOKEN_KEY` must be 32 cryptographically random bytes encoded as base64. Put secrets into Wrangler through its interactive secret input or Cloudflare dashboard; never commit them or paste them into chat. Use the same Plaid production credentials that created the local links.
4. Deploy the Worker and configure Cloudflare Access to protect the whole Worker (both production and preview routes), with an allow policy for the exact owner email. Preview URLs are disabled in the config. The application independently denies every request without Access identity or with the wrong email. Verify both unauthenticated rejection and owner access before importing data.
5. In the empty dashboard, click **Import local data**, and select the existing local `data.json`. This sends its financial data and Plaid access tokens over HTTPS to the authenticated Worker. Tokens are encrypted before D1 storage. The import preserves accounts, sync cursors, transactions, and corrections; it is available only while no accounts are connected. The local file remains untouched. Test a sync and compare data after import.

`src/page.js` is generated from `index.html`: after editing it, run `node -e "const fs=require('fs');fs.writeFileSync('src/page.js','export default '+JSON.stringify(fs.readFileSync('index.html','utf8'))+';\\n')"` from this folder. Run `node --test test/worker.test.js` for the fail-closed access checks. Runtime, migrations, account linking, scheduling, and imports must also be verified against the actual Cloudflare account; the unit tests alone cannot establish deployment safety.

The app and access policy must remain private. Avoid uploading `.env`, `data.json`, wrangler secrets or account backups to GitHub. Plaid and Cloudflare free plans have limits and may change; inspect current terms and do not upgrade without authorization.
