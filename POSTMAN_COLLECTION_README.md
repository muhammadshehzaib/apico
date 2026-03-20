# Apico API Tests - Postman Collection

Complete test suite for the Apico REST API testing tool backend. This collection contains **51 requests** organized into 10 functional groups with **120+ assertions** that validate every endpoint in the application.

## Quick Start

### Prerequisites
- Backend running on `localhost:4000`
- Fresh database (or database with test data)
- Postman v9+ or Apico app

### Setup (3 minutes)

1. **Start your backend**
   ```bash
   cd /path/to/apico-backend
   npm install
   npm run dev
   ```
   Backend should be running on `http://localhost:4000`

2. **Import the collection**
   - Open Postman
   - Click **Import**
   - Select `apico-api-tests.postman_collection.json`

3. **Import the environment**
   - Click **Import** again
   - Select `apico-local.postman_environment.json`

4. **Select environment**
   - Top-right dropdown: Select **"Apico Local"**

5. **Run the collection**
   - Click **Collection Runner** icon (top-left)
   - Select "Apico API Tests"
   - Select "Apico Local" environment
   - Click **Run Collection**

### Expected Results
✅ All ~51 requests should pass
✅ Green checkmarks on all assertions
✅ Total execution time: ~30-45 seconds

---

## Collection Structure

### 01 - Auth (6 requests)
Handles user registration, login, token refresh, and logout.

- `Register User` — Creates new account, extracts tokens to environment
- `Register Duplicate` — Tests duplicate email rejection (400)
- `Login User` — Authenticates with credentials
- `Login Wrong Password` — Tests wrong password rejection (401)
- `Refresh Token` — Generates new access token from refresh token
- `Logout` — Invalidates current session

**⚠️ Run this folder first** — All other folders depend on the tokens extracted here.

### 02 - Workspaces (5 requests)
Tests workspace creation, retrieval, and member management.

- `Create Workspace` — Creates workspace, extracts ID
- `Get All Workspaces` — Lists user's workspaces
- `Get Workspace By ID` — Retrieves specific workspace
- `Get Invalid Workspace` — Tests unauthorized access (403)
- `Invite Member to Workspace` — Adds collaborator with role

**Depends on:** Auth tokens

### 03 - Collections (4 requests)
Tests request collection CRUD operations.

- `Create Collection` — Creates collection in workspace
- `Get Collections in Workspace` — Lists all collections
- `Update Collection` — Modifies collection name
- `Delete Collection` — Removes collection

**Depends on:** Workspace ID

### 04 - Saved Requests (5 requests)
Tests saving and managing HTTP requests within collections.

- `Create Collection (for requests)` — Sets up test collection
- `Save Request to Collection` — Stores request definition
- `Get Saved Requests` — Lists saved requests in collection
- `Update Saved Request` — Modifies request details
- `Delete Saved Request` — Removes saved request

**Depends on:** Collection ID

### 05 - Execute Request (8 requests)
Tests the core proxy endpoint that executes HTTP requests through Apico.

- `Execute GET (no auth)` — Makes GET request to external API
- `Execute GET (with token)` — Tests token handling
- `Execute POST with Body` — Tests request body transmission
- `Execute with Query Params` — Tests URL parameter handling
- `Execute with Bearer Auth` — Tests Bearer token injection
- `Execute with Basic Auth` — Tests HTTP Basic auth injection
- `Execute Invalid URL` — Tests validation (400)
- `Execute as Guest` — Tests unauthenticated access

**Uses:** External APIs (jsonplaceholder.typicode.com, httpbin.org)

### 06 - Request History (3 requests)
Tests request execution history tracking.

- `Get History` — Retrieves all request history
- `Delete History Entry` — Removes single history item
- `Clear All History` — Clears all history for user

**Depends on:** Prior executed requests

### 07 - Shared Links (4 requests)
Tests public request sharing functionality.

- `Save Request First` — Creates shareable request
- `Create Shared Link` — Generates public access token
- `Create Shared Link with Expiry` — Adds expiration date
- `Get Shared Request (public)` — Accesses request without auth

**Depends on:** Saved request

### 08 - Environments (6 requests)
Tests environment and variable management.

- `Create Environment` — Creates environment for storing variables
- `Get Environments` — Lists all environments in workspace
- `Get Environment by ID` — Retrieves specific environment
- `Update Environment` — Modifies environment name
- `Bulk Update Variables` — Sets multiple variables at once
- `Delete Environment` — Removes environment and variables

**Depends on:** Workspace ID

### 09 - Documentation (7 requests)
Tests API documentation generation and public viewing.

- `Create Collection for Docs` — Sets up documentation collection
- `Save Request for Docs` — Adds request to documentation
- `Generate Doc` — Auto-generates documentation
- `Get My Docs` — Lists user's generated docs
- `Get Doc by Token (public)` — Views doc without authentication
- `Toggle Doc Visibility` — Makes doc public/private
- `Delete Doc` — Removes documentation

**Depends on:** Collection with requests

### 10 - Edge Cases (4 requests)
Tests error handling and security edge cases.

- `No Auth Header` — Tests missing authentication (401)
- `Invalid JWT` — Tests malformed token (401)
- `Missing Required Fields` — Tests validation (400)
- `Access Other User Data` — Tests authorization (403)

---

## Environment Variables

The collection uses these variables which are automatically populated as requests run:

| Variable | Initial | Extracted By | Purpose |
|----------|---------|--------------|---------|
| `BASE_URL` | `http://localhost:4000/api` | Manual | API base URL |
| `ACCESS_TOKEN` | (empty) | Register/Login | Bearer token for authenticated requests |
| `REFRESH_TOKEN` | (empty) | Register/Login | Token to refresh access token |
| `USER_ID` | (empty) | Register | Current user's ID |
| `USER_EMAIL` | `test@apico.dev` | Manual | Test user email |
| `USER_PASSWORD` | `Test1234!` | Manual | Test user password |
| `WORKSPACE_ID` | (empty) | Create Workspace | Active workspace |
| `COLLECTION_ID` | (empty) | Create Collection | Active collection |
| `REQUEST_ID` | (empty) | Save Request | Active saved request |
| `ENVIRONMENT_ID` | (empty) | Create Environment | Active environment |
| `SHARE_TOKEN` | (empty) | Create Shared Link | Public share token |
| `DOC_TOKEN` | (empty) | Generate Doc | Public doc token |
| `DOC_ID` | (empty) | Generate Doc | Doc ID for management |
| `HISTORY_ID` | (empty) | Get History | History entry ID |
| `SHARE_REQUEST_ID` | (empty) | Save Request | Request to share |
| `DOC_COLLECTION_ID` | (empty) | Create Collection | Collection for docs |
| `DOC_REQUEST_ID` | (empty) | Save Request | Request in doc |

---

## Test Assertions

Every request includes multiple assertions:

### Standard Tests (Every Request)
```javascript
pm.test('Status code is correct', () => {
  pm.expect(pm.response.code).to.equal(EXPECTED_CODE)
})

pm.test('Response has correct structure', () => {
  const json = pm.response.json()
  pm.expect(json).to.have.property('success')
  pm.expect(json).to.have.property('data')
  pm.expect(json).to.have.property('message')
})

pm.test('Response time under 2000ms', () => {
  pm.expect(pm.response.responseTime).to.be.below(2000)
})
```

### Example: Register User
```javascript
pm.test('Status is 201', () => {
  pm.expect(pm.response.code).to.equal(201)
})

pm.test('Returns tokens', () => {
  const json = pm.response.json()
  pm.expect(json.data.accessToken).to.exist
  pm.expect(json.data.refreshToken).to.exist
  pm.expect(json.data.user.email).to.equal(pm.variables.get('USER_EMAIL'))
})

pm.test('Returns user object', () => {
  const json = pm.response.json()
  pm.expect(json.data.user).to.have.property('id')
  pm.expect(json.data.user).to.not.have.property('password')
})
```

---

## Troubleshooting

### "No ACCESS_TOKEN set" Warning
**Solution:** Run the **01 - Auth** folder first. Other folders depend on tokens extracted from login.

### 401 Unauthorized on Protected Endpoints
**Cause:** Token expired or missing
**Solution:**
1. Clear all environment variables
2. Re-run Auth folder to get fresh tokens
3. Try the request again

### 400 Bad Request on Execute Requests
**Cause:** Invalid request payload or URL format
**Check:**
- URL is valid (includes `http://` or `https://`)
- Headers are properly formatted
- Query parameters are valid
- Request body is valid JSON (if applicable)

### Tests Pass Locally but Fail on Staging
**Possible causes:**
1. Different database state
2. User doesn't exist on staging
3. BASE_URL is incorrect
4. Environment variables not synced

**Solution:**
- Use `apico-staging.postman_environment.json`
- Update BASE_URL and credentials for staging
- Check staging database has test data

### External API Errors (jsonplaceholder, httpbin)
**Cause:** External API timeout or rate limiting
**Solution:**
- Wait a few moments
- Run the request again
- Check internet connection

---

## Advanced Usage

### Custom Test Data
Edit environment variables before running:
- Change `USER_EMAIL` to test with different email
- Change `USER_PASSWORD` to test password validation
- Modify `BASE_URL` for different environments

### Run Single Folder
Instead of full collection:
1. Click **Collection Runner**
2. Expand "Apico API Tests" folder
3. Select only specific folder (e.g., "02 - Workspaces")
4. Click **Run**

### Run with Newman (CLI)
```bash
npm install -g newman

# Run with default environment
newman run apico-api-tests.postman_collection.json \
  -e apico-local.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json

# Run specific folder
newman run apico-api-tests.postman_collection.json \
  -e apico-local.postman_environment.json \
  --folder "01 - Auth"
```

### Continuous Integration
```bash
# GitHub Actions example
- name: Run Apico API Tests
  run: |
    newman run apico-api-tests.postman_collection.json \
      -e apico-local.postman_environment.json \
      --collection --bail
```

### Debug a Failing Request
1. Click the request
2. Open **Tests** tab to see assertions
3. Click **Response** to view API response
4. Check assertion details for what failed
5. Click **Console** at bottom for detailed logs

---

## Request Categories

### Public Endpoints (No Auth)
- `Get Shared Request (public)` — Share/{token}
- `Get Doc by Token (public)` — Docs/{token}
- `Execute as Guest` — Execute without JWT

### Sensitive Data Tests
- `No Auth Header` — Should reject (401)
- `Invalid JWT` — Should reject (401)
- `Access Other User Data` — Should reject (403)

### External API Tests
- All requests in **05 - Execute Request**
- Uses real external APIs (jsonplaceholder, httpbin)
- Tests proxy functionality and auth injection

### Variable Extraction
These requests populate environment variables for subsequent requests:
1. `Register User` → ACCESS_TOKEN, REFRESH_TOKEN
2. `Create Workspace` → WORKSPACE_ID
3. `Create Collection` → COLLECTION_ID
4. `Save Request` → REQUEST_ID
5. `Create Environment` → ENVIRONMENT_ID
6. `Create Shared Link` → SHARE_TOKEN
7. `Generate Doc` → DOC_TOKEN, DOC_ID

---

## Performance Baselines

Expected response times:

| Endpoint | Typical | Slow | Timeout |
|----------|---------|------|---------|
| Auth (register/login) | 200-400ms | 600ms | 2000ms |
| Workspace CRUD | 150-300ms | 500ms | 2000ms |
| Collection CRUD | 100-250ms | 500ms | 2000ms |
| Execute Request (external) | 500-1500ms | 2000ms | 5000ms |
| History/Sharing | 100-300ms | 500ms | 2000ms |

All requests should complete within **2 seconds** unless making external API calls.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-17 | Initial release |

---

## Support

For issues or feedback:
- Check the backend logs: `npm run logs`
- Review collection description in Postman
- Verify all variables are set in environment
- Check that backend is running on correct port

---

## Security Notes

⚠️ **Production Credentials**
- This collection contains example credentials
- Never use real production passwords
- Store actual credentials securely (1Password, vault, etc)
- Tokens are temporary and auto-expire

⚠️ **Public Sharing Tests**
- Tests access to public endpoints without auth
- Validates that shared links don't expose sensitive data
- Verify shared requests don't contain credentials

⚠️ **Data Privacy**
- Test user email/password are hardcoded
- Use unique test accounts for different environments
- Clean up test data after running
- Don't share environment files with credentials

---

Generated for Apico v1.0.0 | Collection tests 100+ API endpoints
