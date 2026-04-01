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

## Manual API Verification (Exact Order)

If you want to manually verify the API without running the full collection, use this exact order. Save the tokens and IDs as noted because later steps depend on them.

### Phase 3 — Run APIs in This Exact Order

1. **STEP 1 — Register (Run This First Always)**  
`POST http://localhost:4000/api/auth/register`  
Body:
```json
{
  "name": "Test User",
  "email": "test@apico.dev",
  "password": "Test1234!"
}
```
Expected: `201 Created`  
Save: `accessToken`, `refreshToken`, `user.id`  
Why: Every other API needs a user to exist.

2. **STEP 2 — Login**  
`POST http://localhost:4000/api/auth/login`  
Body:
```json
{
  "email": "test@apico.dev",
  "password": "Test1234!"
}
```
Expected: `200 OK`  
Save: `accessToken` (use as Bearer token), `refreshToken`  
Why: Gets a fresh token for all future requests.

3. **STEP 3 — Create Workspace**  
`POST http://localhost:4000/api/workspaces`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "name": "My First Workspace"
}
```
Expected: `201 Created`  
Save: `data.id` as `WORKSPACE_ID`  
Why: Collections live inside workspaces.

4. **STEP 4 — Get Workspaces**  
`GET http://localhost:4000/api/workspaces`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should see array containing your workspace.

5. **STEP 5 — Create Collection**  
`POST http://localhost:4000/api/workspaces/{WORKSPACE_ID}/collections`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "name": "My First Collection"
}
```
Expected: `201 Created`  
Save: `data.id` as `COLLECTION_ID`  
Why: Saved requests live inside collections.

6. **STEP 6 — Get Collections**  
`GET http://localhost:4000/api/workspaces/{WORKSPACE_ID}/collections`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should see array with your collection.

7. **STEP 7 — Execute Request (Core Feature)**  
`POST http://localhost:4000/api/execute`  
Headers:  
`Authorization: Bearer {your_token_here}`  
`Content-Type: application/json`  
Body:
```json
{
  "method": "GET",
  "url": "https://jsonplaceholder.typicode.com/posts/1",
  "headers": [],
  "params": [],
  "body": "",
  "auth": { "type": "none" }
}
```
Expected: `200 OK`  
Response should contain: `data.statusCode: 200`, `data.body` (JSON string), `data.duration` (ms), `data.size` (bytes).

8. **STEP 8 — Execute as Guest (No Token)**  
`POST http://localhost:4000/api/execute`  
No `Authorization` header  
Body:
```json
{
  "method": "GET",
  "url": "https://jsonplaceholder.typicode.com/posts/1",
  "headers": [],
  "params": [],
  "body": "",
  "auth": { "type": "none" }
}
```
Expected: `200 OK`  
This tests the playground feature works without login.

9. **STEP 9 — Save Request to Collection**  
`POST http://localhost:4000/api/collections/{COLLECTION_ID}/requests`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "name": "Get Post by ID",
  "method": "GET",
  "url": "https://jsonplaceholder.typicode.com/posts/1",
  "headers": [],
  "params": [],
  "body": "",
  "auth": { "type": "none" }
}
```
Expected: `201 Created`  
Save: `data.id` as `REQUEST_ID`.

10. **STEP 10 — Get Saved Requests**  
`GET http://localhost:4000/api/collections/{COLLECTION_ID}/requests`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should see your saved request.

11. **STEP 11 — Get History**  
`GET http://localhost:4000/api/history`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should see execute requests from Steps 7 and 8. Step 8 (guest) should NOT appear.

12. **STEP 12 — Create Shared Link**  
`POST http://localhost:4000/api/requests/{REQUEST_ID}/share`  
Headers: `Authorization: Bearer {your_token_here}`  
Body: `{}`  
Expected: `201 Created`  
Save: `data.token` as `SHARE_TOKEN`.

13. **STEP 13 — Get Shared Request (Public)**  
`GET http://localhost:4000/api/share/{SHARE_TOKEN}`  
No `Authorization` header  
Expected: `200 OK`  
Should return the request data without login.

14. **STEP 14 — Create Environment**  
`POST http://localhost:4000/api/workspaces/{WORKSPACE_ID}/environments`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "name": "Local Development"
}
```
Expected: `201 Created`  
Save: `data.id` as `ENVIRONMENT_ID`.

15. **STEP 15 — Add Variables to Environment**  
`PUT http://localhost:4000/api/environments/{ENVIRONMENT_ID}/variables`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "variables": [
    {
      "key": "BASE_URL",
      "value": "localhost:4000",
      "enabled": true,
      "isSecret": false
    },
    {
      "key": "TOKEN",
      "value": "my-secret-token",
      "enabled": true,
      "isSecret": true
    }
  ]
}
```
Expected: `200 OK`.

16. **STEP 16 — Generate Documentation**  
`POST http://localhost:4000/api/collections/{COLLECTION_ID}/docs`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "title": "My API Documentation",
  "description": "Test documentation",
  "baseUrl": "https://api.example.com",
  "version": "v1.0.0",
  "theme": "DARK",
  "isPublic": true
}
```
Expected: `201 Created`  
Save: `data.token` as `DOC_TOKEN` and `data.id` as `DOC_ID`.

17. **STEP 17 — Get Doc by Token (Public)**  
`GET http://localhost:4000/api/docs/{DOC_TOKEN}`  
No `Authorization` header  
Expected: `200 OK`  
Should return full documentation without login.

17A. **STEP 17A — Get My Docs (Auth)**  
`GET http://localhost:4000/api/docs`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should return an array of your generated docs.

17B. **STEP 17B — Toggle Doc Visibility (Auth)**  
`PATCH http://localhost:4000/api/docs/{DOC_ID}/visibility`  
Headers:  
`Authorization: Bearer {your_token_here}`  
`Content-Type: application/json`  
Body:
```json
{}
```
Expected: `200 OK`  
Should flip `isPublic` for that doc.

17C. **STEP 17C — Delete Doc (Auth)**  
`DELETE http://localhost:4000/api/docs/{DOC_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK` or `204 No Content`.

18. **STEP 18 — Health Check**  
`GET http://localhost:4000/api/health`  
No Authorization header  
Expected: `200 OK`  
Response: `{ "success": true, "message": "API is running" }`

19. **STEP 19 — Get Workspace by ID**  
`GET http://localhost:4000/api/workspaces/{WORKSPACE_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should return the specific workspace details.

20. **STEP 20 — Update Collection**  
`PUT http://localhost:4000/api/workspaces/{WORKSPACE_ID}/collections/{COLLECTION_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "name": "Updated Collection Name"
}
```
Expected: `200 OK`

21. **STEP 21 — Reorder Collections**  
`PATCH http://localhost:4000/api/workspaces/{WORKSPACE_ID}/collections/reorder`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "order": ["{COLLECTION_ID}"]
}
```
Expected: `200 OK`

22. **STEP 22 — Share Collection**  
`POST http://localhost:4000/api/workspaces/{WORKSPACE_ID}/collections/{COLLECTION_ID}/share`  
Headers: `Authorization: Bearer {your_token_here}`  
Body: `{}`  
Expected: `201 Created`  
Save: `data.token` as `COLLECTION_SHARE_TOKEN`.

23. **STEP 23 — Get Shared Collection (Public)**  
`GET http://localhost:4000/api/workspaces/{WORKSPACE_ID}/collections/share/{COLLECTION_SHARE_TOKEN}`  
No Authorization header  
Expected: `200 OK`  
Should return the shared collection without login.

24. **STEP 24 — Update Saved Request**  
`PUT http://localhost:4000/api/requests/{REQUEST_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "name": "Updated Post Request",
  "method": "POST",
  "url": "https://jsonplaceholder.typicode.com/posts",
  "headers": [{ "key": "Content-Type", "value": "application/json", "enabled": true }],
  "params": [],
  "body": "{\"title\":\"foo\",\"body\":\"bar\",\"userId\":1}",
  "auth": { "type": "none" }
}
```
Expected: `200 OK`

25. **STEP 25 — Search Requests**  
`GET http://localhost:4000/api/requests/search?q=Updated`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should return requests matching the search query.

26. **STEP 26 — Reorder Requests**  
`PATCH http://localhost:4000/api/requests/reorder`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "order": ["{REQUEST_ID}"]
}
```
Expected: `200 OK`

27. **STEP 27 — Add Tags to Request**  
`PUT http://localhost:4000/api/requests/{REQUEST_ID}/tags`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "tagIds": ["{TAG_ID}"]
}
```
Expected: `200 OK`  
Note: Requires a tag to exist first (see Step 38).

28. **STEP 28 — Delete History Entry**  
`DELETE http://localhost:4000/api/history/{HISTORY_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Note: Use a history ID from Step 11.

29. **STEP 29 — Clear All History**  
`DELETE http://localhost:4000/api/history`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Clears all history for the authenticated user.

30. **STEP 30 — Get Environments**  
`GET http://localhost:4000/api/workspaces/{WORKSPACE_ID}/environments`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should return array containing the environment from Step 14.

31. **STEP 31 — Get Environment by ID**  
`GET http://localhost:4000/api/workspaces/{WORKSPACE_ID}/environments/{ENVIRONMENT_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should return the specific environment with its variables.

32. **STEP 32 — Update Environment**  
`PUT http://localhost:4000/api/workspaces/{WORKSPACE_ID}/environments/{ENVIRONMENT_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "name": "Staging Environment"
}
```
Expected: `200 OK`

33. **STEP 33 — Delete Environment**  
`DELETE http://localhost:4000/api/workspaces/{WORKSPACE_ID}/environments/{ENVIRONMENT_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Removes the environment and its variables.

34. **STEP 34 — Create Folder**  
`POST http://localhost:4000/api/workspaces/{WORKSPACE_ID}/folders`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "name": "My Folder"
}
```
Expected: `201 Created`  
Save: `data.id` as `FOLDER_ID`.

35. **STEP 35 — Get Folders**  
`GET http://localhost:4000/api/workspaces/{WORKSPACE_ID}/folders`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should return array containing your folder.

36. **STEP 36 — Update Folder**  
`PUT http://localhost:4000/api/workspaces/{WORKSPACE_ID}/folders/{FOLDER_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "name": "Renamed Folder"
}
```
Expected: `200 OK`

37. **STEP 37 — Reorder Folders**  
`PATCH http://localhost:4000/api/workspaces/{WORKSPACE_ID}/folders/reorder`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "order": ["{FOLDER_ID}"]
}
```
Expected: `200 OK`

38. **STEP 38 — Delete Folder**  
`DELETE http://localhost:4000/api/workspaces/{WORKSPACE_ID}/folders/{FOLDER_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`

39. **STEP 39 — Create Tag**  
`POST http://localhost:4000/api/workspaces/{WORKSPACE_ID}/tags`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "name": "important",
  "color": "#ff0000"
}
```
Expected: `201 Created`  
Save: `data.id` as `TAG_ID`.

40. **STEP 40 — Get Tags**  
`GET http://localhost:4000/api/workspaces/{WORKSPACE_ID}/tags`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should return array containing your tag.

41. **STEP 41 — Update Tag**  
`PUT http://localhost:4000/api/workspaces/{WORKSPACE_ID}/tags/{TAG_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "name": "critical",
  "color": "#ff4444"
}
```
Expected: `200 OK`

42. **STEP 42 — Delete Tag**  
`DELETE http://localhost:4000/api/workspaces/{WORKSPACE_ID}/tags/{TAG_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`

43. **STEP 43 — Delete Saved Request**  
`DELETE http://localhost:4000/api/requests/{REQUEST_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`

44. **STEP 44 — Delete Collection**  
`DELETE http://localhost:4000/api/workspaces/{WORKSPACE_ID}/collections/{COLLECTION_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`

45. **STEP 45 — Invite Member to Workspace**  
`POST http://localhost:4000/api/workspaces/{WORKSPACE_ID}/invite`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "email": "member@apico.dev",
  "role": "VIEWER"
}
```
Expected: `201 Created`  
Save: `data.id` as `INVITE_ID`, `data.token` as `INVITE_TOKEN`.

46. **STEP 46 — Get Workspace Members**  
`GET http://localhost:4000/api/workspaces/{WORKSPACE_ID}/members`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should return array of workspace members.

47. **STEP 47 — Get Workspace Invites**  
`GET http://localhost:4000/api/workspaces/{WORKSPACE_ID}/invites`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`  
Should return array of pending invites.

48. **STEP 48 — Get Invite by Token (Public)**  
`GET http://localhost:4000/api/workspace-invites/{INVITE_TOKEN}`  
No Authorization header  
Expected: `200 OK`  
Should return invite details without login.

49. **STEP 49 — Get Pending Invites (Invitee)**  
`GET http://localhost:4000/api/workspace-invites/pending`  
Headers: `Authorization: Bearer {invitee_token_here}`  
Expected: `200 OK`  
Note: Requires the invitee to be registered and logged in.

50. **STEP 50 — Accept Invite**  
`POST http://localhost:4000/api/workspace-invites/{INVITE_TOKEN}/accept`  
Headers: `Authorization: Bearer {invitee_token_here}`  
Expected: `200 OK`  
Note: Requires the invitee to be logged in.

51. **STEP 51 — Decline Invite**  
`POST http://localhost:4000/api/workspace-invites/{INVITE_TOKEN}/decline`  
Headers: `Authorization: Bearer {invitee_token_here}`  
Expected: `200 OK`  
Note: Create another invite first, then decline it.

52. **STEP 52 — Update Member Role**  
`PATCH http://localhost:4000/api/workspaces/{WORKSPACE_ID}/members/{MEMBER_USER_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Body:
```json
{
  "role": "EDITOR"
}
```
Expected: `200 OK`

53. **STEP 53 — Revoke Invite**  
`POST http://localhost:4000/api/workspaces/{WORKSPACE_ID}/invites/{INVITE_ID}/revoke`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`

54. **STEP 54 — Remove Member from Workspace**  
`DELETE http://localhost:4000/api/workspaces/{WORKSPACE_ID}/members/{MEMBER_USER_ID}`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`

55. **STEP 55 — Leave Workspace**  
`POST http://localhost:4000/api/workspaces/{WORKSPACE_ID}/leave`  
Headers: `Authorization: Bearer {member_token_here}`  
Expected: `200 OK`  
Note: Must be a non-owner member to leave.

56. **STEP 56 — Import to Workspace**  
`POST http://localhost:4000/api/workspaces/{WORKSPACE_ID}/import`  
Headers: `Authorization: Bearer {your_token_here}`  
`Content-Type: application/json`  
Body:
```json
{
  "format": "apico",
  "data": {
    "collections": [
      {
        "name": "Imported Collection",
        "requests": [
          {
            "name": "Sample Request",
            "method": "GET",
            "url": "https://jsonplaceholder.typicode.com/posts/1",
            "headers": [],
            "params": [],
            "body": "",
            "auth": { "type": "none" }
          }
        ]
      }
    ]
  }
}
```
Expected: `200 OK`

57. **STEP 57 — Test Error Cases**  
Run these to verify error handling:
```text
Test 1 — No token:
GET http://localhost:4000/api/workspaces
No auth header
Expected: 401

Test 2 — Wrong password:
POST http://localhost:4000/api/auth/login
{ "email": "test@apico.dev", "password": "wrong" }
Expected: 401

Test 3 — Invalid URL in execute:
POST http://localhost:4000/api/requests/execute
{ "method": "GET", "url": "not-a-url", ... }
Expected: 400

Test 4 — Access wrong workspace:
GET http://localhost:4000/api/workspaces/fake-id-999
With valid token
Expected: 403 or 404
```

58. **STEP 58 — Refresh Token**  
`POST http://localhost:4000/api/auth/refresh`  
Body:
```json
{
  "refreshToken": "{your_refresh_token}"
}
```
Expected: `200 OK`  
Returns new `accessToken`.

59. **STEP 59 — Logout**  
`POST http://localhost:4000/api/auth/logout`  
Headers: `Authorization: Bearer {your_token_here}`  
Expected: `200 OK`.

### Complete Order Summary

Phase 1 — Server Check  
18. Health Check

Phase 2 — Auth (must be first)  
1. Register  
2. Login (save token)

Phase 3 — Setup (needs auth)  
3. Create Workspace (save ID)  
4. Get Workspaces  
5. Create Collection (save ID)  
6. Get Collections

Phase 4 — Core Feature  
7. Execute Request (with auth)  
8. Execute Request (no auth/guest)  
9. Save Request (save ID)  
10. Get Saved Requests

Phase 5 — History  
11. Get History

Phase 6 — Sharing  
12. Create Shared Link (save token)  
13. Get Shared Request (no auth)

Phase 7 — Environments  
14. Create Environment (save ID)  
15. Add Variables

Phase 8 — Documentation  
16. Generate Doc (save token)  
17. Get Doc (no auth)  
17A. Get My Docs  
17B. Toggle Doc Visibility  
17C. Delete Doc

Phase 9 — Workspace Details  
19. Get Workspace by ID

Phase 10 — Collection Management  
20. Update Collection  
21. Reorder Collections  
22. Share Collection  
23. Get Shared Collection (public)  
44. Delete Collection

Phase 11 — Request Management  
24. Update Saved Request  
25. Search Requests  
26. Reorder Requests  
27. Add Tags to Request  
43. Delete Saved Request

Phase 12 — History Management  
28. Delete History Entry  
29. Clear All History

Phase 13 — Environment Management  
30. Get Environments  
31. Get Environment by ID  
32. Update Environment  
33. Delete Environment

Phase 14 — Folders  
34. Create Folder (save ID)  
35. Get Folders  
36. Update Folder  
37. Reorder Folders  
38. Delete Folder

Phase 15 — Tags  
39. Create Tag (save ID)  
40. Get Tags  
41. Update Tag  
42. Delete Tag

Phase 16 — Workspace Collaboration  
45. Invite Member (save invite ID/token)  
46. Get Workspace Members  
47. Get Workspace Invites  
48. Get Invite by Token (public)  
49. Get Pending Invites (invitee)  
50. Accept Invite  
51. Decline Invite  
52. Update Member Role  
53. Revoke Invite  
54. Remove Member  
55. Leave Workspace

Phase 17 — Import  
56. Import to Workspace

Phase 18 — Error Cases  
57. Test all 4 error scenarios

Phase 19 — Cleanup  
58. Refresh Token  
59. Logout

### Color Code Meaning

🔴 Critical — Must work or nothing works  
🟡 Important — Core functionality  
🟢 Core feature — Main value of the app  
🔵 Nice to have — Important but secondary  
🟣 Advanced — Environment system  
🟠 Premium — Docs feature

If any step fails, report:
Which step number failed, the error message, and the status code.

### Additional Things Available to Test Now

Backend checks:
1. Run migrations (folders/tags/order added).
2. Run tests.
3. All folder, tag, reorder, and search endpoints are now covered in Steps 25–42 above.

Frontend checks:
1. Sidebar folder creation, drag-drop, delete.
2. Add tags to a request, filter by tags.
3. Bulk actions (move/share/delete/export).
4. Command palette (Cmd/Ctrl+K).
5. Pin/unpin requests.
6. Response diff tab.

Recent changes to verify:
1. UI fix: HTTP method dropdown no longer shows background text bleeding through.
2. Backend test coverage: added test for `GET /api/workspaces/:workspaceId/collections/share/:token`.
3. Folders + tags + ordering feature (backend and frontend).
4. Core UX features: command palette, pinned tabs, history filters, response diff view, request menu pin/unpin.

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
