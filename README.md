# opti-cms-client

A robust, framework-agnostic TypeScript client for Optimizely CMS. Works seamlessly with any JavaScript framework including Astro, Next.js, Vue, React, or vanilla JavaScript.

## Installation

```bash
npm install opti-cms-client
```

or

```bash
yarn add opti-cms-client
```

## Features

- Framework-agnostic - works with any JavaScript environment
- Full TypeScript support with comprehensive type definitions
- Modern ESM and CommonJS support
- Zero dependencies for core functionality
- Built-in timeout and error handling
- OAuth 2.0 client credentials authentication with automatic token refresh
- Support for user impersonation (act_as)
- Bearer token authentication support
- Support for Optimizely CMS API preview3 version
- ETag support for conditional updates
- RFC 7807 compliant error handling
- Pagination support for list endpoints
- Full CRUD operations (Create, Read, Update, Delete)

## Usage

### Basic Usage

```typescript
import { OptiCmsClient } from 'opti-cms-client';

// Option 1: OAuth 2.0 with Client Credentials (recommended)
const client = new OptiCmsClient({
  credentials: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
  version: 'preview3', // optional, defaults to 'preview3'
});

// Authentication happens automatically on first request
// Tokens are automatically refreshed before expiration
const response = await client.getContent('content-id');

// Or manually authenticate
await client.authenticate();

// Option 2: Direct Bearer Token (if you manage tokens externally)
const tokenClient = new OptiCmsClient({
  accessToken: 'your-bearer-token',
  autoRefreshToken: false, // disable auto-refresh for external tokens
});

// Option 3: Custom base URL
const customClient = new OptiCmsClient({
  baseUrl: 'https://your-custom-api.com',
  credentials: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
  timeout: 30000, // optional, defaults to 30000ms
});

// Get a single content item (returns ApiResponse with data and etag)
const contentResponse = await client.getContent('content-id');
console.log(contentResponse.data); // ContentItem
console.log(contentResponse.etag); // ETag for conditional updates

// List content items with pagination
const paginatedContent = await client.listContent({
  pageIndex: 0,
  pageSize: 50,
});
console.log(paginatedContent.items); // ContentItem[]
console.log(paginatedContent.totalItemCount); // Total count

// Create new content
const newContent = await client.createContent({
  contentType: 'PageType',
  name: 'New Page',
  // ... other properties
});

// Update content with ETag for safe updates
const updated = await client.updateContent(
  'content-id',
  { name: 'Updated Name' },
  { etag: contentResponse.etag }
);

// Delete content
await client.deleteContent('content-id');
```

### With Astro

```typescript
---
import { OptiCmsClient } from 'opti-cms-client';

const client = new OptiCmsClient({
  credentials: {
    clientId: import.meta.env.OPTI_CMS_CLIENT_ID,
    clientSecret: import.meta.env.OPTI_CMS_CLIENT_SECRET,
  },
});

const response = await client.getContent('page-id');
---

<div>
  <h1>{response.data.name}</h1>
</div>
```

### With Next.js

```typescript
import { OptiCmsClient } from 'opti-cms-client';

export async function getStaticProps() {
  const client = new OptiCmsClient({
    credentials: {
      clientId: process.env.OPTI_CMS_CLIENT_ID!,
      clientSecret: process.env.OPTI_CMS_CLIENT_SECRET!,
    },
  });

  const response = await client.getContent('page-id');

  return {
    props: { content: response.data },
  };
}
```

### With Vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { OptiCmsClient } from 'opti-cms-client';

const content = ref(null);
const client = new OptiCmsClient({
  credentials: {
    clientId: import.meta.env.VITE_OPTI_CMS_CLIENT_ID,
    clientSecret: import.meta.env.VITE_OPTI_CMS_CLIENT_SECRET,
  },
});

onMounted(async () => {
  const response = await client.getContent('page-id');
  content.value = response.data;
});
</script>
```

### With Vanilla JavaScript

```javascript
import { OptiCmsClient } from 'opti-cms-client';

const client = new OptiCmsClient({
  credentials: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
});

client.getContent('page-id').then((response) => {
  console.log(response.data);
});
```

## Authentication

The client supports two authentication methods:

### OAuth 2.0 Client Credentials (Recommended)

The OAuth 2.0 flow is the recommended authentication method. Tokens are automatically managed and refreshed:

```typescript
const client = new OptiCmsClient({
  credentials: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
});

// Token is obtained automatically on first API call
// Token is automatically refreshed 30 seconds before expiration (tokens last 5 minutes)
```

#### Creating API Keys

1. Navigate to Settings > API Keys in your CMS
2. Click Create API Key
3. Provide a name (letters, numbers, hyphens, underscores only)
4. Save the generated Client ID and Secret securely

### Bearer Token

If you manage tokens externally, you can provide a bearer token directly:

```typescript
const client = new OptiCmsClient({
  accessToken: 'your-bearer-token',
  autoRefreshToken: false, // disable auto-refresh
});

// Update token manually when needed
client.setAccessToken('new-token', 300); // token expires in 300 seconds
```

### User Impersonation

When your API key has impersonation enabled, you can perform operations on behalf of a user:

```typescript
const client = new OptiCmsClient({
  credentials: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    actAs: 'user@example.com', // impersonate this user
  },
});

// All operations will be performed with the permissions of the impersonated user
```

You can also authenticate with different users:

```typescript
const client = new OptiCmsClient({
  credentials: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
});

// Authenticate as a specific user
await client.authenticate({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  actAs: 'user@example.com',
});
```

### Token Management

The client automatically manages tokens with these features:

- Tokens are refreshed 30 seconds before expiration (default 5 minutes)
- Automatic retry on authentication failure
- Thread-safe token refresh
- Manual token management available

```typescript
// Check token status
console.log(client.hasAccessToken()); // true/false
console.log(client.getTokenExpiresAt()); // timestamp or undefined

// Manually refresh token
await client.authenticate();

// Set external token
client.setAccessToken('external-token', 300);
```

## API Reference

### OptiCmsClient

#### Constructor

```typescript
new OptiCmsClient(config: ClientConfig)
```

**ClientConfig:**

- `baseUrl` (string, optional): Base URL of your CMS API. Defaults to `https://api.cms.optimizely.com/{version}/`
- `tokenEndpoint` (string, optional): OAuth token endpoint. Defaults to `https://api.cms.optimizely.com/oauth/token`
- `accessToken` (string, optional): Direct bearer token for authentication
- `credentials` (OAuthCredentials, optional): OAuth client credentials for authentication
  - `clientId` (string): OAuth client ID
  - `clientSecret` (string): OAuth client secret
  - `actAs` (string, optional): User email for impersonation
- `version` (ApiVersion, optional): API version to use: `'preview2'` or `'preview3'` (default: `'preview3'`)
- `timeout` (number, optional): Request timeout in milliseconds (default: 30000)
- `autoRefreshToken` (boolean, optional): Automatically refresh tokens before expiration (default: true)
- `headers` (Record<string, string>, optional): Additional headers to include in requests

#### Methods

##### getContent

```typescript
async getContent(contentId: string, options?: RequestOptions): Promise<ApiResponse<ContentItem>>
```

Retrieves a single content item by ID. Returns an `ApiResponse` containing the data and ETag.

##### listContent

```typescript
async listContent(options?: RequestOptions & {
  pageIndex?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<ContentItem>>
```

Retrieves a paginated list of content items. Returns items, pageIndex, pageSize, and totalItemCount.

##### createContent

```typescript
async createContent(content: Partial<ContentItem>, options?: RequestOptions): Promise<ApiResponse<ContentItem>>
```

Creates a new content item.

##### updateContent

```typescript
async updateContent(
  contentId: string,
  updates: Partial<ContentItem>,
  options?: RequestOptions
): Promise<ApiResponse<ContentItem>>
```

Updates an existing content item using PATCH (preview3 only). Supports conditional updates via ETag.

##### deleteContent

```typescript
async deleteContent(contentId: string, options?: RequestOptions): Promise<ApiResponse<void>>
```

Deletes a content item by ID.

##### authenticate

```typescript
async authenticate(credentials?: OAuthCredentials): Promise<TokenResponse>
```

Manually authenticate and obtain an access token using OAuth 2.0 client credentials flow.

##### getBaseUrl

```typescript
getBaseUrl(): string
```

Returns the configured base URL.

##### getVersion

```typescript
getVersion(): ApiVersion
```

Returns the configured API version.

##### getTokenEndpoint

```typescript
getTokenEndpoint(): string
```

Returns the configured OAuth token endpoint.

##### hasAccessToken

```typescript
hasAccessToken(): boolean
```

Returns whether an access token is available.

##### hasCredentials

```typescript
hasCredentials(): boolean
```

Returns whether OAuth credentials are configured.

##### getTokenExpiresAt

```typescript
getTokenExpiresAt(): number | undefined
```

Returns the timestamp when the current token expires.

##### setAccessToken

```typescript
setAccessToken(token: string, expiresIn?: number): void
```

Manually set an access token and its expiration time.

## Types

The library exports the following TypeScript types:

- `ClientConfig` - Client configuration options
- `RequestOptions` - Request-specific options including headers, params, and etag
- `ContentItem` - Content item structure
- `ApiResponse<T>` - API response wrapper with data, status, and etag
- `ErrorResponse` - RFC 7807 compliant error response
- `PaginatedResponse<T>` - Paginated list response with items and pagination metadata
- `ApiVersion` - API version type (`'preview2'` | `'preview3'`)
- `ValidationError` - Validation error details
- `OAuthCredentials` - OAuth client credentials with optional impersonation
- `TokenResponse` - OAuth token response structure

## Error Handling

The client throws RFC 7807 compliant errors that you can catch and handle:

```typescript
try {
  const response = await client.getContent('invalid-id');
} catch (error) {
  const err = error as ErrorResponse;
  if (err.status === 404) {
    console.error('Content not found:', err.title);
  } else if (err.status === 408) {
    console.error('Request timeout');
  } else if (err.status === 400 && err.errors) {
    console.error('Validation errors:', err.errors);
  } else {
    console.error('An error occurred:', err.title, err.details);
  }
}
```

## Pagination

List endpoints support pagination using `pageIndex` and `pageSize`:

```typescript
const page1 = await client.listContent({
  pageIndex: 0,
  pageSize: 100, // default is 100
});

console.log(page1.items); // Array of content items
console.log(page1.totalItemCount); // Total number of items
console.log(page1.pageIndex); // Current page index
console.log(page1.pageSize); // Page size

// Get next page
const page2 = await client.listContent({
  pageIndex: 1,
  pageSize: 100,
});
```

## ETag Support

Use ETags for conditional updates to prevent concurrent modification conflicts:

```typescript
// Get content with ETag
const response = await client.getContent('content-id');
console.log(response.etag); // ETag value

// Update with ETag to ensure no concurrent modifications
try {
  const updated = await client.updateContent(
    'content-id',
    { name: 'New Name' },
    { etag: response.etag }
  );
} catch (error) {
  if (error.status === 412) {
    console.error('Content was modified by another request');
  }
}
```

## Development

```bash
# Install dependencies
yarn install

# Build the library
yarn build

# Watch mode for development
yarn dev

# Type check
yarn type-check

# Lint
yarn lint
```

## Versioning

This project uses [standard-version](https://github.com/conventional-changelog/standard-version) for versioning.

```bash
# Create a new release
yarn release

# Create a specific version
yarn release:major
yarn release:minor
yarn release:patch
```

## License

MIT

## Author

Marvin Oey <marvin.oey@optimizely.com>

## Repository

https://github.com/marvoey/opti-cms-client
