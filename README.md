# n8n-nodes-custom-embedder

This is an n8n community node. It lets you use **Custom Embedder** in your n8n workflows.

**Custom Embedder** is a LangChain sub-node that converts text into embedding vectors for use with Vector Store root nodes like Qdrant, Pinecone, and others. It integrates with custom embedding APIs to generate vector representations of text data.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Local Development Installation

For local development using npm link:

1. Build and create link in the project directory:
```bash
npm run build
npm link
```

2. Link in n8n's nodes directory:
```bash
cd ~/.n8n/nodes/
npm link n8n-nodes-custom-embedder
```

3. Restart n8n.

## Operations

This node operates as a **sub-node** within n8n's LangChain cluster nodes structure. It must be connected to a Vector Store root node (such as Qdrant Vector Store, Pinecone Vector Store, etc.).

**Operation:**
- **Generate Embedding**: Converts text from the root node into an embedding vector using your custom embedding API.

The node automatically appears in the **Embeddings** group when adding sub-nodes to Vector Store nodes.

## Credentials

This node requires authentication with your custom embedding API.

**Prerequisites:**
- An API key from your custom embedding API service

**Authentication Method:**
- **API Key**: Uses `X-API-KEY` header for authentication

**Setup:**
1. In n8n, go to **Credentials** → **Add Credential**
2. Select **Custom Embedder API**
3. Enter your API Key
4. Click **Test** to verify the connection
5. Click **Save**

The credentials are automatically applied to API requests via the `X-API-KEY` header.

## Compatibility

- **Minimum n8n version**: 2.0.0
- **Tested with**: n8n 2.4.6+
- **Node.js**: 18.x or higher
- **TypeScript**: 5.9.2

This node is designed for self-hosted n8n installations and follows the LangChain sub-node pattern.

## Usage

### Connecting to a Vector Store

1. Add a Vector Store root node to your workflow (e.g., Qdrant Vector Store, Pinecone Vector Store)
2. In the Vector Store node, go to the **Embeddings** section
3. Click **Add Embedding**
4. Select **Custom Embedder**
5. Choose your Custom Embedder API credentials

### Data Flow

The Custom Embedder sub-node receives text data from the root node's context and returns embedding vectors:

```
Vector Store Root Node
    ↓ (provides text)
Custom Embedder Sub-node
    ↓ (generates embedding)
Vector Store Root Node
    ↓ (stores embedding)
```

### Text Input

The node expects text data in one of these fields from the root node:
- `text`
- `content`
- `data`

The node processes only the first item when multiple items are provided (sub-node behavior).

### Troubleshooting

**"Node does not have a `supplyData` method defined"**
- Ensure the node is properly built and linked
- Restart n8n after installation

**"Text field not found in input data"**
- Verify the root node provides text in `text`, `content`, or `data` fields
- Check that the Vector Store node is properly configured

For detailed implementation guide, see [nodes/CustomEmbedder/README.md](./nodes/CustomEmbedder/README.md).

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [LangChain in n8n](https://docs.n8n.io/advanced-ai/langchain/langchain-n8n/)
* [Sub-nodes documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/)
* [Vector Store nodes](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/)

## Version history

### 0.1.0

Initial release.

**Features:**
- Custom Embedding API integration
- LangChain sub-node implementation
- Credentials-based authentication with `X-API-KEY` header
- Automatic grouping in Embeddings category
- Support for text, content, and data field inputs
