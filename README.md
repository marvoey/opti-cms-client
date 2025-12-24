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
- Configurable headers and authentication

## Usage

### Basic Usage

```typescript
import { OptiCmsClient } from 'opti-cms-client';

const client = new OptiCmsClient({
  baseUrl: 'https://your-optimizely-instance.com/api',
  apiKey: 'your-api-key', // optional
  timeout: 30000, // optional, defaults to 30000ms
});

// Get a single content item
const content = await client.getContent('content-id');

// List all content items
const contentList = await client.listContent();
```

### With Astro

```typescript
---
import { OptiCmsClient } from 'opti-cms-client';

const client = new OptiCmsClient({
  baseUrl: import.meta.env.OPTI_CMS_BASE_URL,
  apiKey: import.meta.env.OPTI_CMS_API_KEY,
});

const content = await client.getContent('page-id');
---

<div>
  <h1>{content.name}</h1>
</div>
```

### With Next.js

```typescript
import { OptiCmsClient } from 'opti-cms-client';

export async function getStaticProps() {
  const client = new OptiCmsClient({
    baseUrl: process.env.OPTI_CMS_BASE_URL!,
    apiKey: process.env.OPTI_CMS_API_KEY,
  });

  const content = await client.getContent('page-id');

  return {
    props: { content },
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
  baseUrl: import.meta.env.VITE_OPTI_CMS_BASE_URL,
  apiKey: import.meta.env.VITE_OPTI_CMS_API_KEY,
});

onMounted(async () => {
  content.value = await client.getContent('page-id');
});
</script>
```

### With Vanilla JavaScript

```javascript
import { OptiCmsClient } from 'opti-cms-client';

const client = new OptiCmsClient({
  baseUrl: 'https://your-optimizely-instance.com/api',
  apiKey: 'your-api-key',
});

client.getContent('page-id').then((content) => {
  console.log(content);
});
```

## API Reference

### OptiCmsClient

#### Constructor

```typescript
new OptiCmsClient(config: ClientConfig)
```

**ClientConfig:**

- `baseUrl` (string, required): Base URL of your Optimizely CMS API
- `apiKey` (string, optional): API key for authentication
- `timeout` (number, optional): Request timeout in milliseconds (default: 30000)
- `headers` (Record<string, string>, optional): Additional headers to include in requests

#### Methods

##### getContent

```typescript
async getContent(contentId: string, options?: RequestOptions): Promise<ContentItem>
```

Retrieves a single content item by ID.

##### listContent

```typescript
async listContent(options?: RequestOptions): Promise<ContentItem[]>
```

Retrieves a list of content items.

##### getBaseUrl

```typescript
getBaseUrl(): string
```

Returns the configured base URL.

##### hasApiKey

```typescript
hasApiKey(): boolean
```

Returns whether an API key is configured.

## Types

The library exports the following TypeScript types:

- `ClientConfig`
- `RequestOptions`
- `ContentItem`
- `ApiResponse`
- `ErrorResponse`

## Error Handling

The client throws typed errors that you can catch and handle:

```typescript
try {
  const content = await client.getContent('invalid-id');
} catch (error) {
  if (error.status === 404) {
    console.error('Content not found');
  } else if (error.status === 408) {
    console.error('Request timeout');
  } else {
    console.error('An error occurred:', error.message);
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
