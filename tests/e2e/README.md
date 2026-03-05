# E2E Tests - Crown Platform

Tests end-to-end pour l'authentification (Phase 1).

## Setup

1. **Installer dépendances:**

   ```bash
   npm install
   npx playwright install --with-deps chromium
   ```

2. **Configurer `.env.test`:**

   ```bash
   BASE_URL=http://localhost:3000
   SUPABASE_URL=https://qzxnlhzlilysiklmbspn.supabase.co
   SUPABASE_ANON_KEY=<dev_anon_key>
   SUPABASE_SERVICE_ROLE_KEY=<dev_service_key>
   ```

3. **Démarrer serveur dev:**
   ```bash
   npm run dev
   ```

## Run Tests

```bash
# Headless mode
npm run test:e2e

# UI mode (debug)
npm run test:e2e:ui

# Headed mode
npm run test:e2e:headed

# Specific test
npm run test:e2e -- auth.signin.spec.ts
```

## Architecture

### Page Object Models

Encapsulent les sélecteurs et actions par page:

- **`SigninPage`**: `/auth/signin`
- **`SignupPage`**: `/auth/signup`
- **`PasswordResetPage`**: `/auth/ask-password-change`

### Database Helpers

- **`createTestUser(email, password)`**: Créer user avec email confirmé
- **`deleteTestUser(email)`**: Cleanup
- **`setOnboardingStep(email, step)`**: Modifier profil
- **`getUserProfile(email)`**: Récupérer profil

### Test Data Generators

- **`generateTestEmail()`**: Email unique par test
- **`VALID_TEST_PASSWORD`**: Password conforme aux règles

## Test Coverage (Phase 1)

### Signin (7 tests)

- ✅ Login successful with valid credentials
- ✅ Redirect to onboarding if incomplete
- ✅ Error for invalid credentials
- ✅ Error for non-existent user
- ✅ Navigation to signup page
- ✅ Navigation to password reset page
- ✅ Form validation (disabled button)

### Signup (9 tests)

- ✅ Successfully create new account
- ✅ Login after email confirmation
- ✅ Error for invalid email format
- ✅ Password requirements tooltip
- ✅ Password strength validation
- ✅ Error when passwords don't match
- ✅ Require terms acceptance
- ✅ Navigation to signin page
- ✅ Error for duplicate email

### Password Reset (5 tests)

- ✅ Send reset email for existing user
- ✅ Success message for non-existent email
- ✅ Email format validation
- ✅ Navigate back to signin
- ✅ Button disabled when email empty

**Total**: 21 tests

## Best Practices

1. **Isolation**: Chaque test crée ses propres données
2. **Cleanup**: Toujours delete users dans `afterEach`
3. **Email Bypass**: Utiliser Admin API avec `email_confirm: true`
4. **Locators**: Préférer role/placeholder plutôt que class/id
5. **Attente**: Utiliser `expect().toBeVisible()` plutôt que `waitForTimeout`

## Adding New Tests

1. Créer spec: `tests/e2e/specs/my-feature.spec.ts`
2. Créer page object si nécessaire: `tests/e2e/pages/my-page.page.ts`
3. Utiliser helpers existants pour setup/teardown
4. Run: `npm run test:e2e -- my-feature.spec.ts`

## Debugging

### View Traces

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

### View Report

```bash
npm run test:e2e:report
```

### UI Mode

```bash
npm run test:e2e:ui
```

## CI/CD

E2E tests run automatically in GitHub Actions:

- Triggered on PR and push to main/dev
- Uses DEV Supabase instance
- Artifacts: Playwright report + traces on failure

### GitHub Secrets Required

- `SUPABASE_DEV_URL`
- `SUPABASE_DEV_ANON_KEY`
- `SUPABASE_DEV_SERVICE_KEY`

## Common Issues

### Tests fail with "User already exists"

- Ensure `deleteTestUser()` is called in `afterEach()`
- Use `generateTestEmail()` for unique emails

### Tests timeout

- Check that dev server is running (`npm run dev`)
- Increase timeout in `playwright.config.ts` if needed

### Email verification issues

- Ensure `email_confirm: true` is used in `createTestUser()`
- Check SUPABASE_SERVICE_ROLE_KEY is valid

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
