# GrabDocs E2E Testing Suite

Comprehensive **end-to-end testing** framework for [GrabDocs.com](https://app.grabdocs.com) using Playwright. This suite covers critical user journeys including authentication, document management, accessibility, and security.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Test Descriptions](#test-descriptions)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## 🎯 Overview

This testing suite provides automated end-to-end testing for GrabDocs, focusing on **25 tests** (20 with @critical tag) that validate core functionality:

- **Authentication** (2 tests): Login/logout/invalid login flow, session persistence
- **Document Management** (6 tests): Upload, search, preview, download, sharing, empty state
- **Chat/AI Interaction** (2 tests): Message sending/response, export conversation
- **Chat History** (2 tests): View conversations, delete conversation
- **Analytics** (2 tests): View analytics page, export data
- **Calendar** (2 tests): View calendar, create event
- **Forms** (1 test): Create form from template
- **Links** (1 test): Create quick link
- **Reach/Meetings** (3 tests): Create meeting, schedule meeting, start meeting
- **Workspace** (1 test): Create workspace
- **Accessibility** (1 test): WCAG 2.1 compliance
- **Security** (2 tests): HTTPS enforcement, 404 error handling

## ✨ Features

- ✅ **Automated OTP Handling**: Auto-fills OTP code or supports manual entry
- ✅ **Remember Device**: Saves authentication state to skip OTP on subsequent runs
- ✅ **Video Recording**: All tests are recorded and viewable in HTML reports
- ✅ **Flexible Selectors**: Auto-detects form fields and UI elements
- ✅ **Comprehensive Reporting**: HTML reports with screenshots, videos, and traces
- ✅ **Accessibility Testing**: Built-in axe-core integration for WCAG compliance
- ✅ **Browser Support**: Chromium (fast and reliable)
- ✅ **Environment Configuration**: Easy switching between environments
- ✅ **Test Tagging**: Organized test execution by category

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

### 2. Configure Environment

Create a `.env` file or export variables:

```bash
export E2E_BASE_URL="https://app.grabdocs.com"
export E2E_LOGIN_PATH="/login"
export E2E_EMAIL="your@email.com"
export E2E_PASSWORD="yourpassword"
```

### 3. Run Tests

```bash
# Run all tests
npm run test:e2e

# Run with visible browser
npm run test:headed

# Run specific test file
npx playwright test tests/auth.spec.ts --headed
```

## ⚙️ Setup & Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Valid GrabDocs account credentials

### Installation Steps

1. **Clone or navigate to the project:**
   ```bash
   cd grabdocs-e2e
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

4. **Configure environment variables** (see [Configuration](#configuration))

5. **Verify setup:**
   ```bash
   npx playwright test --list
   ```

## 🔧 Configuration

### Environment Variables

All configuration is done via environment variables. Create a `.env` file or export them in your shell:

#### Required Variables

```bash
# Application URL
E2E_BASE_URL="https://app.grabdocs.com"  # Default: https://app.grabdocs.com

# Login Configuration
E2E_LOGIN_PATH="/login"                   # Login page path
E2E_EMAIL="your@email.com"                # Your GrabDocs email
E2E_PASSWORD="yourpassword"               # Your GrabDocs password
```

#### OTP Configuration

```bash
# Option 1: Auto-fill OTP (recommended)
E2E_OTP_MODE="code"                       # Default: "code"
E2E_OTP_CODE="335577"                     # Your OTP code (default: 335577)

# Option 2: Manual OTP entry
E2E_OTP_MODE="manual"                     # Pauses for manual entry
```

#### Advanced Configuration

```bash
# Custom Selectors (if default detection fails)
E2E_LOGIN_EMAIL_SELECTOR='input[name="email"]'
E2E_LOGIN_PASSWORD_SELECTOR='input[name="password"]'
E2E_LOGIN_SUBMIT_SELECTOR='button[type="submit"]'

# Remember Device (skip OTP on subsequent runs)
E2E_USE_SAVED_STATE="true"                # Default: "true" - saves auth state to .auth/storage-state.json

# Performance Testing
E2E_SLOWMO=100                            # Slow down actions (ms)

# Interactive Mode
E2E_INTERACTIVE_LOGIN=1                   # Pause at login for review
```

### Playwright Configuration

The main configuration is in `playwright.config.ts`:

- **Base URL**: Set via `E2E_BASE_URL` environment variable (default: `https://app.grabdocs.com`)
- **Timeout**: 3 minutes (180000ms) for tests with OTP
- **Retries**: 2 retries in CI, 0 locally
- **Workers**: 1 worker in CI, parallel locally (auto-detected)
- **Projects**: Chromium only (for faster, consistent test execution)
- **Video Recording**: Enabled for all tests (`video: 'on'`) - viewable in HTML reports
- **Storage State**: Saves authentication state to `.auth/storage-state.json` (remember device)
- **SlowMo**: Configurable via `E2E_SLOWMO` environment variable (ms)

### Browser Configuration

**Chromium** is the only configured browser project:
- Bundled Chromium browser (comes with Playwright)
- Fast and reliable test execution
- Consistent results across environments

## ▶️ Running Tests

### Run All Tests

```bash
# Headless mode (faster)
npm run test:e2e

# Visible browser (for debugging)
npm run test:headed
```

### Run with Advanced Options

```bash
# Full command with environment variables and options
cd /Users/jude.osafo/Downloads/grabdocs-e2e && \
E2E_BASE_URL="https://app.grabdocs.com" \
E2E_LOGIN_PATH="/login" \
npx playwright test --project=Chromium --headed --workers=1

# Shorter version (if .env file is configured)
npm run test:headed -- --project=Chromium --workers=1

# Run with single worker (sequential execution, better for debugging)
npx playwright test --workers=1 --headed
```

**Options Explained:**
- `--workers=1`: Run tests sequentially (one at a time) - more stable for debugging
- `--headed`: Run with visible browser window
- Environment variables can be set inline or via `.env` file
- Tests run on Chromium browser only (configured in `playwright.config.ts`)

### Run by Test File

```bash
# Authentication tests
npx playwright test tests/auth.spec.ts --headed

# Document tests
npx playwright test tests/functional-document.spec.ts --headed

# Chat tests
npx playwright test tests/functional-chat.spec.ts --headed

# Chat History tests
npx playwright test tests/functional-chat-history.spec.ts --headed

# Analytics tests
npx playwright test tests/functional-analytics.spec.ts --headed

# Calendar tests
npx playwright test tests/functional-calendar.spec.ts --headed

# Forms tests
npx playwright test tests/functional-forms.spec.ts --headed

# Links tests
npx playwright test tests/functional-links.spec.ts --headed

# Reach/Meetings tests
npx playwright test tests/functional-reach.spec.ts --headed

# Workspace tests
npx playwright test tests/functional-workspace.spec.ts --headed

# Accessibility tests
npx playwright test tests/ui-accessibility.spec.ts --headed

# Security tests
npx playwright test tests/security.spec.ts --headed
```

### Run by Tag

```bash
# Critical tests only
npx playwright test --grep "@critical"

# Multiple tags
npx playwright test --grep "@critical|@functional"

# Exclude tags
npx playwright test --grep "@critical" --grep-invert "@a11y"
```

### Run Specific Test

```bash
npx playwright test -g "Login with valid credentials" --headed
```

### Run with Debug Inspector

```bash
PWDEBUG=1 npx playwright test --headed
```

This opens Playwright Inspector, allowing you to:
- Step through test execution
- Inspect page state
- Debug selectors
- Pause/resume execution

## 📁 Test Structure

```
grabdocs-e2e/
├── playwright.config.ts          # Playwright configuration
├── package.json                  # Dependencies and scripts
├── .env                          # Environment variables (create this)
├── tests/
│   ├── fixtures/
│   │   └── auth.ts              # Login fixture with OTP handling
│   ├── utils/
│   │   ├── selectors.ts         # Centralized CSS selectors
│   │   ├── a11y.ts              # Accessibility utilities
│   │   ├── performance.ts       # Performance measurement
│   │   └── security.ts          # Security testing utilities
│   ├── assets/
│   │   └── sample.pdf           # Test file for uploads
│   ├── auth.spec.ts             # Authentication tests (2 tests)
│   ├── functional-document.spec.ts  # Document tests (6 tests)
│   ├── functional-chat.spec.ts      # Chat tests (2 tests)
│   ├── functional-chat-history.spec.ts  # Chat history tests (2 tests)
│   ├── functional-analytics.spec.ts     # Analytics tests (2 tests)
│   ├── functional-calendar.spec.ts      # Calendar tests (2 tests)
│   ├── functional-forms.spec.ts         # Forms tests (1 test)
│   ├── functional-links.spec.ts        # Links tests (1 test)
│   ├── functional-reach.spec.ts        # Reach/Meetings tests (3 tests)
│   ├── functional-workspace.spec.ts    # Workspace tests (1 test)
│   ├── ui-accessibility.spec.ts        # Accessibility tests (1 test)
│   └── security.spec.ts         # Security tests (2 tests)
└── test-results/                # Test reports and artifacts
```

## 📝 Test Descriptions

### Authentication Tests (`tests/auth.spec.ts`)

**Total: 2 tests**

#### 1. Login, logout, then invalid login @critical @functional @regression @smoke
- **Purpose**: Validates complete authentication flow including login, logout, and invalid login handling
- **Steps**: 
  - Login with correct credentials (auto-fills OTP)
  - Verify successful login and navigation
  - Logout and verify redirect to login page
  - Attempt login with invalid credentials
  - Verify error message is displayed
- **Expected**: Successful login, logout, and proper error handling for invalid credentials

#### 2. Session persistence after refresh @critical
- **Purpose**: Validates session remains active after page refresh
- **Steps**:
  - Login successfully
  - Refresh page
  - Verify still logged in (not redirected to login)
- **Expected**: Session persists after refresh

### Document Management Tests (`tests/functional-document.spec.ts`)

**Total: 6 tests** (Upload, Search, Preview, Download, Empty State, Sharing)

#### 5. Upload PDF document @critical
- **Purpose**: Validates document upload functionality
- **Steps**:
  - Navigate to upload page
  - Select PDF file
  - Upload file
  - Verify file appears in document list
- **Expected**: File uploaded successfully and visible

#### 6. Search documents by filename @critical
- **Purpose**: Validates search functionality
- **Steps**:
  - Upload a document
  - Enter search query
  - Verify document appears in results
- **Expected**: Search returns matching documents

#### 7. Preview document @critical
- **Purpose**: Validates document preview functionality
- **Steps**:
  - Click on a document
  - Verify document viewer opens
  - Verify viewer elements are visible
- **Expected**: Document preview displays correctly

#### 8. Download document @critical
- **Purpose**: Validates document download functionality
- **Steps**:
  - Open document preview
  - Click download button
  - Verify download starts
- **Expected**: File download initiated

#### 9. Search empty state shows message @critical
- **Purpose**: Validates empty state handling
- **Steps**:
  - Search for non-existent document
  - Verify empty state message appears
- **Expected**: Appropriate "no results" message displayed

#### 10. Document sharing generates link @critical
- **Purpose**: Validates document sharing functionality
- **Steps**:
  - Open document
  - Click share button
  - Verify share link/URL is generated
- **Expected**: Share link or modal displayed

### Chat/AI Tests (`tests/functional-chat.spec.ts`)

**Total: 2 tests**

#### 11. Chat/AI interaction sends message and receives response @critical
- **Purpose**: Validates chat/AI functionality and UI elements
- **Steps**:
  - Navigate to upload page
  - Verify chat input UI exists and is enabled
  - Send a message
  - Verify message was sent (functionality check)
  - Verify response area appears (UI check)
  - Verify AI response content (functionality check)
- **Expected**: Chat UI visible, message sent successfully, response area appears with content

#### 12. Export or download conversation @functional
- **Purpose**: Validates conversation export/download functionality
- **Steps**:
  - Navigate to upload page
  - Send a test message to create conversation
  - Look for export/download button (checks multiple locations and menus)
  - Click export button
  - Verify download starts or export modal appears
  - Verify file has valid name and extension
- **Expected**: Export button found, download initiated with valid file, or export modal displayed
- **Note**: Test skips gracefully if export feature is not available

### Chat History Tests (`tests/functional-chat-history.spec.ts`)

**Total: 2 tests**

#### 13. View chat history page and conversations @critical
- **Purpose**: Validates chat history page loads and displays conversations
- **Steps**:
  - Navigate to chat history page
  - Verify page loads correctly
  - Verify conversations are displayed
- **Expected**: Chat history page loads and shows existing conversations

#### 14. Delete chat conversation @functional
- **Purpose**: Validates deletion of chat conversations
- **Steps**:
  - Navigate to chat history page
  - Find a conversation to delete
  - Click delete button/icon
  - Refresh page and verify conversation is removed
- **Expected**: Conversation deleted and no longer visible after refresh

### Analytics Tests (`tests/functional-analytics.spec.ts`)

**Total: 2 tests**

#### 15. Navigate to Analytics page and view data @critical
- **Purpose**: Validates analytics page loads and displays data
- **Steps**:
  - Navigate to analytics page (`/analysis`)
  - Verify page loads correctly
  - Verify analytics data/charts are visible
- **Expected**: Analytics page loads and displays data

#### 16. Export analytics data @functional
- **Purpose**: Validates analytics data export functionality
- **Steps**:
  - Navigate to analytics page
  - Find export button/option
  - Click export and verify download or export modal
- **Expected**: Analytics data can be exported successfully

### Calendar Tests (`tests/functional-calendar.spec.ts`)

**Total: 2 tests**

#### 17. View calendar page @critical
- **Purpose**: Validates calendar page loads correctly
- **Steps**:
  - Navigate to calendar page
  - Verify calendar UI is visible
  - Verify calendar displays correctly
- **Expected**: Calendar page loads and displays calendar interface

#### 18. Add new event and confirm creation @critical
- **Purpose**: Validates event creation functionality
- **Steps**:
  - Navigate to calendar page
  - Click to add new event
  - Fill event details (title, date, time)
  - Click "Create Event" button
  - Refresh page and verify event appears in calendar
- **Expected**: Event created successfully and visible in calendar after refresh

### Forms Tests (`tests/functional-forms.spec.ts`)

**Total: 1 test**

#### 19. Open forms, select template, and create form @critical
- **Purpose**: Validates form creation from template
- **Steps**:
  - Navigate to forms page (`/forms`)
  - Select a form template
  - Click on template to open form builder
  - Click "Save Form" icon/button
  - Refresh page and verify form appears in list
- **Expected**: Form created from template and saved successfully

### Links Tests (`tests/functional-links.spec.ts`)

**Total: 1 test**

#### 20. Create new link and verify it was created @critical
- **Purpose**: Validates quick link creation functionality
- **Steps**:
  - Navigate to links page (`/quick-links`)
  - Click "Create Link" button
  - Fill link form (URL, title, description)
  - Click "Create Link" to save
  - Refresh page and verify link appears in list
- **Expected**: Link created successfully and visible in list after refresh

### Reach/Meetings Tests (`tests/functional-reach.spec.ts`)

**Total: 3 tests**

#### 21. Create meeting and verify it was created @critical
- **Purpose**: Validates meeting creation functionality
- **Steps**:
  - Navigate to video-meeting page (`/video-meeting`)
  - Click "Create Meeting" button
  - Fill meeting form (optional title)
  - Click "Create Meeting" to save
  - Refresh page and verify meeting appears in list
- **Expected**: Meeting created successfully and visible in list after refresh

#### 22. Schedule meeting and verify it was scheduled @critical
- **Purpose**: Validates meeting scheduling functionality
- **Steps**:
  - Navigate to video-meeting page
  - Click "Schedule Meeting" button
  - Fill meeting form (title, date, time)
  - Click "Schedule Meeting" to save
  - Refresh page and verify scheduled meeting appears
- **Expected**: Meeting scheduled successfully and visible in list after refresh

#### 23. Start meeting by clicking start meeting icon @critical
- **Purpose**: Validates starting a meeting from the meetings list
- **Steps**:
  - Create a meeting first
  - Refresh page to see the created meeting
  - Find the meeting in the list
  - Click the start meeting icon/button
  - Verify meeting interface loads
- **Expected**: Meeting starts successfully and meeting interface is visible

### Workspace Tests (`tests/functional-workspace.spec.ts`)

**Total: 1 test**

#### 24. Create workspace and verify it was created @critical
- **Purpose**: Validates workspace creation functionality
- **Steps**:
  - Navigate to workspaces page (`/workspaces`)
  - Click "Create Workspace" button
  - Fill workspace form (name, description)
  - Click "Create" button to save
  - Refresh page and verify workspace appears in list
- **Expected**: Workspace created successfully and visible in list after refresh

### Accessibility Tests (`tests/ui-accessibility.spec.ts`)

**Total: 1 test**

#### 25. Login page accessibility @critical
- **Purpose**: Validates WCAG 2.1 Level A compliance
- **Checks**:
  - Form labels present
  - Keyboard navigation works
  - Color contrast meets standards
  - ARIA attributes correct
  - Focus indicators visible
- **Expected**: No critical accessibility violations

### Security Tests (`tests/security.spec.ts`)

**Total: 2 tests**

#### 26. HTTPS enforcement @critical
- **Purpose**: Validates secure connection
- **Steps**:
  - Navigate to login page
  - Verify URL uses HTTPS
- **Expected**: All connections use HTTPS protocol

#### 27. 404 error page displays correctly @functional @security
- **Purpose**: Validates error handling for invalid URLs
- **Steps**:
  - Navigate to non-existent page
  - Check HTTP response status (404)
  - Verify 404 page content/UI elements are displayed
  - Verify page handles error gracefully
- **Expected**: 404 status code or 404 page content visible, or redirects to home page
- **Note**: Accepts both explicit 404 pages and redirects to home (both are valid)

## 🔍 Troubleshooting

### Common Issues

#### 1. Test Timeout During Login

**Problem**: Tests timeout at 60 seconds during login

**Solutions**:
- Timeouts are set to 3 minutes by default
- If still timing out, check OTP code is correct
- Verify network connectivity
- Check if login page is accessible

```bash
# Verify login page loads
curl -I https://app.grabdocs.com/login

# Run with extended timeout
npx playwright test --timeout=300000
```

#### 2. OTP Code Not Auto-Filling

**Problem**: OTP code `335577` is not being filled automatically

**Solutions**:
- Verify OTP code is correct: `E2E_OTP_CODE="335577"`
- Check OTP mode is set: `E2E_OTP_MODE="code"`
- Run with debug to see what's happening:
  ```bash
  PWDEBUG=1 npx playwright test --headed
  ```
- Manually inspect OTP input field selector

#### 3. Elements Not Found

**Problem**: Tests fail with "Element not found" errors

**Solutions**:
- Check if selectors are correct in `tests/utils/selectors.ts`
- Verify page has loaded completely
- Use Playwright Inspector to inspect elements:
  ```bash
  PWDEBUG=1 npx playwright test --headed
  ```
- Check if page structure has changed

#### 4. Tests Running on Wrong URL

**Problem**: Tests point to wrong application

**Solutions**:
- Verify `E2E_BASE_URL` is set correctly
- Check `playwright.config.ts` baseURL
- Clear environment variables:
  ```bash
  unset E2E_BASE_URL
  export E2E_BASE_URL="https://app.grabdocs.com"
  ```

#### 5. Browser Not Opening

**Problem**: Browser doesn't open in headed mode

**Solutions**:
- Verify Playwright browsers are installed:
  ```bash
  npx playwright install
  ```
- Check if `--headed` flag is used
- Verify display settings (for headless servers)

#### 6. About:blank Page

**Problem**: Browser shows "about:blank" and doesn't navigate

**Solutions**:
- Click "Resume" in Playwright Inspector (if using PWDEBUG=1)
- Remove `PWDEBUG=1` if you want automatic navigation
- Check if baseURL is configured correctly
- Verify network connectivity

### Debugging Tips

1. **Use Playwright Inspector**:
   ```bash
   PWDEBUG=1 npx playwright test --headed
   ```

2. **View Test Reports**:
   ```bash
   npx playwright show-report
   ```

3. **Check Screenshots**:
   - Screenshots are saved in `test-results/` on failure
   - View in HTML report

4. **View Trace Files**:
   ```bash
   npx playwright show-trace test-results/path-to-trace.zip
   ```

5. **Run Single Test**:
   ```bash
   npx playwright test -g "Test name" --headed
   ```

## 🤖 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}
          E2E_EMAIL: ${{ secrets.E2E_EMAIL }}
          E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
          E2E_OTP_CODE: ${{ secrets.E2E_OTP_CODE }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Execution Strategy

1. **On Pull Requests**: Run smoke tests only
   ```bash
   npm run test:smoke -- --workers=1
   ```

2. **On Merge to Main**: Run full test suite
   ```bash
   npm run test:e2e
   ```

3. **Nightly**: Run full suite with retries
   ```bash
   npm run test:e2e -- --retries=2
   ```

## 📊 Test Reports

### HTML Report

After test execution, view the HTML report:

```bash
npx playwright show-report
```

The report includes:
- Test execution summary
- Pass/fail status
- Screenshots on failure
- **Video recordings for all tests** (click on any test to view the video)
- Performance metrics
- Trace files

**Note**: All tests are recorded with video by default. Click on any test in the HTML report to view the video recording of what happened during the test execution.

### Report Location

- **HTML Report**: `playwright-report/index.html`
- **Test Results**: `test-results/`
- **Videos**: `test-results/*/video.webm`
- **Screenshots**: `test-results/*/test-failed-*.png`
- **Traces**: `test-results/*/trace.zip`

## 🏗️ Architecture

### Fixtures

#### Auth Fixture (`tests/fixtures/auth.ts`)

Provides `login` fixture that handles:
- Navigation to login page
- Form filling (email/password)
- OTP handling (auto-fill or manual)
- **Session persistence** (saves authentication state to `.auth/storage-state.json`)
- **Remember device** (reuses saved session to skip OTP on subsequent runs)
- Error handling

**Remember Device Feature**: After the first successful login (which may include OTP), the authentication state is saved. On subsequent test runs, the saved state is reused, allowing tests to skip the login/OTP flow. Set `E2E_USE_SAVED_STATE="false"` to disable this feature.

**Usage**:
```typescript
test('My test', async ({ page, login }) => {
  await login(); // Automatically logs in
  // Test continues with authenticated session
});
```

### Utilities

#### Selectors (`tests/utils/selectors.ts`)

Centralized CSS selectors for consistency:
```typescript
export const sel = {
  email: '[data-testid="login-email"]',
  password: '[data-testid="login-password"]',
  // ...
};
```

#### Accessibility (`tests/utils/a11y.ts`)

Accessibility testing utilities:
- `setupA11y(page)`: Injects axe-core
- `checkAccessibility(page, options)`: Runs accessibility checks

#### Performance (`tests/utils/performance.ts`)

Performance measurement utilities:
- `measurePageLoad(page)`: Measures page load time
- `measureUploadTime(page, selector, filePath)`: Measures upload duration

#### Security (`tests/utils/security.ts`)

Security validation utilities:
- `checkHTTPS(page)`: Verifies HTTPS usage
- `checkNoSensitiveDataInURL(page)`: Checks for sensitive data in URLs

## 🎯 Best Practices

### Writing Tests

1. **Use Descriptive Test Names**:
   ```typescript
   test('User can upload PDF and verify it appears in document list @critical', async ({ page }) => {
     // ...
   });
   ```

2. **Use Appropriate Tags**:
   - `@critical` - Essential tests
   - `@functional` - Feature tests
   - `@a11y` - Accessibility tests
   - `@security` - Security tests

3. **Use Centralized Selectors**:
   ```typescript
   import { sel } from './utils/selectors';
   await page.click(sel.uploadBtn);
   ```

4. **Handle Async Operations**:
   ```typescript
   await page.waitForLoadState('networkidle');
   await page.waitForTimeout(1000); // If needed
   ```

5. **Add Meaningful Assertions**:
   ```typescript
   await expect(page.locator(sel.docCard)).toBeVisible();
   ```

### Test Organization

1. **Group Related Tests**: Use `test.describe()` blocks
2. **Use beforeEach/afterEach**: For common setup/teardown
3. **Keep Tests Independent**: Each test should run independently
4. **Use Fixtures**: For reusable setup (like login)

### Selector Strategy

1. **Prefer `data-testid`**: Most reliable
2. **Use Semantic Selectors**: `role`, `label`, etc.
3. **Avoid XPath**: Fragile and hard to maintain
4. **Use Flexible Selectors**: Handle dynamic content

### Error Handling

1. **Use Try-Catch**: For expected failures
2. **Add Timeouts**: For slow operations
3. **Use Conditional Checks**: `if (await element.isVisible())`
4. **Provide Fallbacks**: Multiple selector strategies

## 📚 Additional Resources

### Playwright Documentation
- [Playwright Docs](https://playwright.dev/)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)

### Testing Best Practices
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)

## 🤝 Contributing

1. Follow test naming conventions: `@tag1 @tag2 Test description`
2. Use centralized selectors from `tests/utils/selectors.ts`
3. Add appropriate tags for test categorization
4. Include error handling and recovery scenarios
5. Document environment-specific requirements
6. Update this README when adding new tests

## 📄 License

MIT

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review test reports for error details
3. Run tests with `PWDEBUG=1` for debugging
4. Check Playwright documentation

---

**Last Updated**: 2024
**Test Suite Version**: 1.0.0
**Playwright Version**: ^1.49.0
