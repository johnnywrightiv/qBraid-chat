# README: qBraid Chat Extension for VS Code

## Overview
The **qBraid Chat Extension** is a Visual Studio Code extension designed to interact with the [qBraid REST API](https://docs.qbraid.com/api-reference/user-guide/introduction). It allows users to authenticate with their qBraid API Key, send chat messages to qBraid's endpoints, and query platform-specific resources like quantum devices and job statuses.

---

## Features
- **Authenticate Easily**: Authenticate with your qBraid API Key. (This can be done from a prompt or from the command palette.)
- **Chat Interface**: Send messages to qBraid’s chat endpoint (`POST /chat`) and receive real-time streamed responses.
- **Model Selection**: Choose from available models populated via the `GET /chat/models` endpoint.
- **Platform Queries**: Check:
  - Available quantum devices.
  - Status of recent quantum jobs.

---

## Installation

### Prerequisites
- Visual Studio Code installed.
- Node.js and npm installed (for development).

### Installation Steps
1. Download the extension file `qbraid-chat-0.1.0.vsix` from the provided source.
2. Open your terminal and install the extension:
   ```bash
   code --install-extension "qbraid-chat-0.1.0.vsix"
   ```

---

## Usage
1. Open the qBraid Chat Extension sidebar in Visual Studio Code.
2. Authenticate with your qBraid API Key.
3. Use the chat interface to:
   - Send messages to qBraid’s chat endpoint.
   - Query quantum devices or job statuses.
4. Select your preferred model from the dropdown populated dynamically from the API.
5. Enjoy real-time responses and platform-specific insights.

---

## Resources
- [qBraid API Documentation](https://docs.qbraid.com/api-reference/user-guide/introduction)
- [VS Code Extension API Documentation](https://code.visualstudio.com/api)
