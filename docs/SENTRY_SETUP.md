# Sentry Setup Guide

## Step 1: Install Dependencies

Run the following command to install the Sentry package:

```bash
npm install
```

This will install `@sentry/nuxt` which was added to `package.json`.

## Step 2: Get Your Sentry DSN

1. Go to your Sentry project: https://sentry.io/organizations/crown-ib/projects/javascript-nuxt/
2. Navigate to **Settings** > **Client Keys (DSN)**
3. Copy the DSN value (it looks like: `https://xxxxx@sentry.io/xxxxx`)

## Step 3: Configure Environment Variables in Vercel

### For Production

1. Go to Vercel project settings: https://vercel.com/crown-ib/crown/settings/environment-variables
2. Add the following environment variable:
   - **Key**: `NUXT_PUBLIC_SENTRY_DSN`
   - **Value**: Your Sentry DSN
   - **Environments**: Check **Production**, **Preview**, and optionally **Development**

### For Source Maps Upload (Recommended)

To enable source maps upload for better error stack traces:

1. Generate a Sentry Auth Token:
   - Go to https://sentry.io/settings/account/api/auth-tokens/
   - Click **Create New Token**
   - Name: `Crown Vercel Deploy`
   - Scopes: Select `project:releases` and `project:write`
   - Copy the token

2. Add to Vercel environment variables:
   - **Key**: `SENTRY_AUTH_TOKEN`
   - **Value**: Your Sentry auth token (commence par `sntrys_`)
   - **Environments**: Check **Production** and **Preview** (PAS Development)

⚠️ **Important**: Si vous ne configurez pas le `SENTRY_AUTH_TOKEN`, vous verrez ces warnings dans les logs Vercel :

```
[error] [sentry-rollup-plugin] Warning: No auth token provided. Will not create release.
[error] [sentry-rollup-plugin] Warning: No auth token provided. Will not upload source maps.
```

Cela signifie que les source maps ne seront pas uploadées et les erreurs Sentry afficheront du code minifié.

### Optional: Custom Environment Names

By default, the environment is determined by `VERCEL_ENV` (production, preview, development).
If you want to use custom environment names:

- **Key**: `NUXT_PUBLIC_SENTRY_ENVIRONMENT`
- **Value**: `production`, `staging`, `review`, etc.
- **Environments**: Set differently for each environment

## Step 4: Deploy

After setting the environment variables:

1. Redeploy your application on Vercel
2. Errors will now be sent to Sentry

## Step 5: Verify Installation

### Test Error Capture

Add this temporary code to any page to test:

```vue
<template>
  <div>
    <v-btn @click="testSentry">Test Sentry</v-btn>
  </div>
</template>

<script setup>
import * as Sentry from '@sentry/nuxt'

const testSentry = () => {
  Sentry.captureMessage('Test error from Crown app', 'info')
  throw new Error('This is a test error for Sentry')
}
</script>
```

### Check Sentry Dashboard

1. Click the button in your app
2. Go to https://sentry.io/organizations/crown-ib/issues/
3. You should see the test error appear within a few seconds

## Environment Variable Summary

| Variable                         | Required       | Purpose                 | Where to Get            |
| -------------------------------- | -------------- | ----------------------- | ----------------------- |
| `NUXT_PUBLIC_SENTRY_DSN`         | ✅ Yes         | Sentry project DSN      | Sentry Project Settings |
| `SENTRY_AUTH_TOKEN`              | ⚠️ Recommended | Upload source maps      | Sentry Auth Tokens      |
| `NUXT_PUBLIC_SENTRY_ENVIRONMENT` | ❌ Optional    | Custom environment name | Set manually            |

## Local Development

**Sentry is completely disabled for local development** (`npm run dev`).

When running locally:

- Sentry will not initialize
- No errors will be sent to Sentry
- You'll see a console message: `[Sentry] Monitoring disabled for local development`

This prevents cluttering your Sentry dashboard with development errors and improves local development performance.

**To test Sentry locally (not recommended):**

If you absolutely need to test Sentry in local development, you can temporarily set the `VERCEL_ENV` variable:

```bash
# .env
NUXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
VERCEL_ENV=preview
```

However, this is not recommended as it will send all your local development errors to Sentry.

## Troubleshooting

### Errors Not Appearing

1. Check that the DSN is correctly set in Vercel
2. Redeploy the app after setting environment variables
3. Check browser console for Sentry initialization errors

### Source Maps Not Working

1. Verify `SENTRY_AUTH_TOKEN` is set in Vercel
2. Check the Sentry auth token has `project:releases` and `project:write` scopes
3. Look at build logs in Vercel for source map upload errors

### Build Warnings Attendus

Ces warnings dans les logs Vercel sont **normaux** :

#### ✅ Attendu (si pas de SENTRY_AUTH_TOKEN)

```
[error] [sentry-rollup-plugin] Warning: No auth token provided
```

→ Solution : Ajoutez `SENTRY_AUTH_TOKEN` dans Vercel

#### ✅ Attendu (limitation Vercel)

```
[warn] [Sentry] Warning: The Sentry SDK detected a Vercel build.
The Sentry Nuxt SDK currently does not support tracing on Vercel.
```

→ C'est normal, le tracing serveur n'est pas supporté sur Vercel, mais **les erreurs sont quand même capturées**.

#### ✅ Attendu (source maps activées)

```
[log] [Sentry] Enabled source map generation in the build options
[log] [Sentry] Setting sourceMapsUploadOptions.sourcemaps.filesToDeleteAfterUpload
```

→ Bon signe ! Les source maps sont activées et seront supprimées après upload.

### Too Many Events

If you're hitting Sentry quota limits:

1. Adjust sample rates in `sentry.client.config.js` and `sentry.server.config.js`
2. Add more error patterns to `ignoreErrors` arrays
3. Use `beforeSend` to filter specific errors

## Next Steps

- Review the full documentation in `docs/SENTRY.md`
- Configure Sentry alerts for critical errors
- Add user context in authentication flow
- Add custom tags for auction tracking

## Support

For issues or questions about Sentry:

- Sentry Documentation: https://docs.sentry.io/platforms/javascript/guides/nuxt/
- Sentry Support: https://sentry.io/support/
