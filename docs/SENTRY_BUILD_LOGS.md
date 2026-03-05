# Comprendre les Logs de Build Sentry

## 📊 Logs Attendus sur Vercel

Voici ce que vous devriez voir dans les logs de build Vercel après avoir configuré Sentry.

### ✅ Logs Normaux (avec SENTRY_AUTH_TOKEN)

```bash
[log] [Sentry] Enabled source map generation in the build options with
      `nitro.rollupConfig.output.sourcemap: hidden`.

[log] [Sentry] Disabled source map setting in the Nuxt config:
      `nitro.rollupConfig.output.sourcemapExcludeSources`.
      Source maps will include the actual code to be able to un-minify
      code snippets in Sentry.

[log] [Sentry] Setting `sentry.sourceMapsUploadOptions.sourcemaps.
      filesToDeleteAfterUpload: [".*/**/public/**/*.map"]`
      to delete generated source maps after they were uploaded to Sentry.

[log] [Sentry] Uploading source maps...
[log] [Sentry] Source maps uploaded successfully
      ✓ 15 files uploaded
      ✓ Release created: crown@1.0.0-abc123

[warn] [Sentry] Warning: The Sentry SDK detected a Vercel build.
       The Sentry Nuxt SDK currently does not support tracing on Vercel.

[info] [nuxi] Building for Nitro preset: `vercel`
```

### ⚠️ Logs si SENTRY_AUTH_TOKEN Manquant

```bash
[warn] [Sentry] Parts of source map generation are currently disabled
       in your Nuxt configuration (`sourcemap.client: false`).

[error] [sentry-rollup-plugin] Warning: No auth token provided.
        Will not create release. Please set the `authToken` option.

[error] [sentry-rollup-plugin] Warning: No auth token provided.
        Will not upload source maps. Please set the `authToken` option.

[warn] [Sentry] Warning: The Sentry SDK detected a Vercel build.
```

## 🔍 Explication des Messages

### 1. Source Maps Generation

```
[log] [Sentry] Enabled source map generation in the build options
      with `nitro.rollupConfig.output.sourcemap: hidden`.
```

✅ **Signification** : Les source maps sont activées en mode `hidden`

- Elles sont générées pendant le build
- Elles ne sont PAS exposées publiquement
- Elles sont uploadées vers Sentry
- Elles sont supprimées après upload

### 2. Source Code Inclusion

```
[log] [Sentry] Disabled source map setting:
      `nitro.rollupConfig.output.sourcemapExcludeSources`
```

✅ **Signification** : Le code source est inclus dans les source maps

- Permet à Sentry de montrer le code original
- Nécessaire pour "un-minifier" les stack traces
- Sécurisé car les source maps ne sont pas publiques

### 3. Auto-Cleanup

```
[log] [Sentry] Setting sourceMapsUploadOptions.sourcemaps.
      filesToDeleteAfterUpload: [".*/**/public/**/*.map"]`
```

✅ **Signification** : Nettoyage automatique après upload

- Les `.map` sont supprimés du bundle final
- Réduit la taille du déploiement
- Empêche l'exposition publique des source maps

### 4. Upload Success

```
[log] [Sentry] Source maps uploaded successfully
      ✓ 15 files uploaded
```

✅ **Signification** : Upload réussi !

- Tous les chunks JS ont leurs source maps sur Sentry
- Les erreurs afficheront du code non-minifié
- Les numéros de ligne seront corrects

### 5. Vercel Tracing Warning

```
[warn] [Sentry] Warning: The Sentry SDK detected a Vercel build.
       The Sentry Nuxt SDK currently does not support tracing on Vercel.
```

✅ **C'est normal !** C'est une limitation connue de Sentry sur Vercel.

**Ce qui fonctionne quand même :**

- ✅ Capture des erreurs client
- ✅ Capture des erreurs serveur
- ✅ Source maps
- ✅ Session Replay
- ✅ Breadcrumbs

**Ce qui ne fonctionne pas :**

- ❌ Performance tracing côté serveur (APM)

**Impact** : Minime. Les erreurs sont capturées, seul le tracing de performance serveur est désactivé.

### 6. No Auth Token Errors

```
[error] [sentry-rollup-plugin] Warning: No auth token provided.
```

❌ **Action requise** : Ajoutez `SENTRY_AUTH_TOKEN` dans Vercel

**Conséquences si non résolu :**

- Les source maps ne seront pas uploadées
- Les erreurs Sentry afficheront du code minifié
- Difficile de débugger les erreurs en production

## 🎯 Checklist Post-Déploiement

Après un déploiement, vérifiez dans les logs Vercel :

### ✅ Ce que vous DEVEZ voir

- [ ] `[log] [Sentry] Enabled source map generation`
- [ ] `[log] [Sentry] Source maps uploaded successfully`
- [ ] `✓ X files uploaded` (où X > 0)
- [ ] `[warn] [Sentry] Warning: The Sentry SDK detected a Vercel build` (normal)

### ❌ Ce que vous NE DEVEZ PAS voir

- [ ] `[error] No auth token provided` → Ajoutez `SENTRY_AUTH_TOKEN`
- [ ] `sourcemap.client: false` → Déjà corrigé dans `nuxt.config.js`

## 🧪 Test Rapide

### 1. Déclenchage d'une erreur test

Ajoutez temporairement dans une page :

```vue
<script setup>
onMounted(() => {
  console.log('Testing Sentry source maps')
  throw new Error('Test Sentry source maps - ' + new Date().toISOString())
})
</script>
```

### 2. Vérification dans Sentry

Allez sur : https://sentry.io/organizations/crown-ib/issues/

Vérifiez que vous voyez :

✅ **Avec source maps (correct)** :

```javascript
Error: Test Sentry source maps - 2024-12-09T...
  at setup (pages/test.vue:4:3)

// Code source visible :
throw new Error('Test Sentry source maps - ' + new Date().toISOString())
```

❌ **Sans source maps (problème)** :

```javascript
Error: Test Sentry source maps - 2024-12-09T...
  at t (chunk-abc123.js:1:2847)

// Code minifié :
throw new Error("Test Sentry source maps - "+new Date().toISOString())
```

## 🔧 Résolution de Problèmes

### Problème : "No auth token provided"

**Solution** :

1. Créez un token : https://sentry.io/settings/account/api/auth-tokens/
2. Ajoutez dans Vercel : `SENTRY_AUTH_TOKEN=sntrys_...`
3. Redéployez

### Problème : Source maps uploadées mais code toujours minifié

**Causes possibles** :

1. Release/version mismatch
2. Token sans permissions suffisantes
3. Organisation ou projet incorrect dans `nuxt.config.js`

**Vérification** :

```javascript
// Dans nuxt.config.js
sentry: {
  sourceMapsUploadOptions: {
    org: 'crown-ib',           // ← Vérifiez
    project: 'javascript-nuxt', // ← Vérifiez
    authToken: process.env.SENTRY_AUTH_TOKEN
  }
}
```

### Problème : Trop de fichiers uploadés (lent)

**Normal** : L'upload peut prendre 10-30 secondes selon le nombre de chunks.

Si vraiment trop lent, vous pouvez filtrer :

```javascript
sentry: {
  sourceMapsUploadOptions: {
    org: 'crown-ib',
    project: 'javascript-nuxt',
    authToken: process.env.SENTRY_AUTH_TOKEN,
    sourcemaps: {
      assets: ['./.output/public/**/*.js']
    }
  }
}
```

## 📚 Resources

- **Sentry Nuxt Docs** : https://docs.sentry.io/platforms/javascript/guides/nuxt/
- **Source Maps Guide** : https://docs.sentry.io/platforms/javascript/sourcemaps/
- **Vercel Integration** : https://docs.sentry.io/platforms/javascript/guides/nuxt/manual-setup/#vercel

## 🎬 Exemple Complet de Logs Réussis

```bash
[log] [Sentry] Enabled source map generation with sourcemap: hidden
[log] [Sentry] Disabled sourcemapExcludeSources
[log] [Sentry] Setting filesToDeleteAfterUpload: [".*/**/public/**/*.map"]
[log] [Sentry] Uploading source maps for release: crown@prod-abc123

▲ [Sentry] Source Maps Upload
  ✓ Fetching organization info
  ✓ Determining files to upload
  ✓ Compressing files

  ✓ Uploaded 15 files (compressed 2.1 MB → 487 KB)
    - chunk-HASH1.js + map
    - chunk-HASH2.js + map
    - ...

  ✓ Created release: crown@prod-abc123
  ✓ Associated 15 source maps with release

[log] [Sentry] Source maps successfully uploaded and deleted from build output

[warn] [Sentry] Warning: The Sentry SDK detected a Vercel build.
       The Sentry Nuxt SDK currently does not support tracing on Vercel.

[info] ✓ Build completed successfully
```

Si vous voyez ces logs, **tout est parfait** ! ✨
