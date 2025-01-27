export function getWebviewContent(): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>qBraid Chat</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
      :root {
        --send-button-bg: #db0c81;
        --send-button-bg-hover: #a810c2;
      }
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background-color: var(--vscode-editor-background/50);
        margin: 0;
        display: flex;
        flex-direction: column;
        height: 92vh;
        padding: 20px;
      }
      .container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
      }
      h1 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 20px;
        color: var(--vscode-textLink-foreground);
      }
      #model-select {
        margin-bottom: 20px;
        padding: 8px;
        background-color: var(--vscode-dropdown-background);
        color: var(--vscode-dropdown-foreground);
        border: 1px solid var(--vscode-dropdown-border);
        border-radius: 4px;
      }
      #chat-history {
        flex-grow: 1;
        overflow-y: auto;
        margin-bottom: 20px;
        padding: 15px;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
      }
      #prompt-container {
        display: flex;
        gap: 10px;
      }
      #prompt-input {
        flex-grow: 1;
        height: 30px;
        padding: 10px;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
      }
      .button {
        background-color: var(--send-button-bg);
        color: var(--vscode-button-foreground);
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
      .button i {
        margin-right: 5px;
      }
      .button:hover {
        background-color: var(--send-button-bg-hover);
      }
      .message {
        margin-bottom: 20px;
        padding: 12px;
        border-radius: 4px;
        max-width: 100%;
      }
      .user-message {
        background-color: var(--vscode-textBlockQuote-background);
        color: var(--vscode-foreground);
        align-self: flex-end;
      }
      .assistant-message {
        background-color: var(--vscode-editor-inactiveSelectionBackground);
        color: var(--vscode-foreground);
        align-self: flex-start;
      }
      #api-key-manager {
        margin-top: 30px;
        padding: 20px;
        background-color: var(--vscode-panel-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
      }
      #api-key-input {
        width: 100%;
        padding: 10px;
        margin-bottom: 15px;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
      }
      #api-key-status {
        margin-bottom: 10px;
        font-weight: bold;
      }
      .button-container {
        display: flex;
        justify-content: space-between;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <img src="https://mintlify.s3.us-west-1.amazonaws.com/qbraidco/_static/logo.png" alt="qBraid icon" style="margin-bottom: 20px;">
      <label for="model-select">Select chat model:</label>
      <select id="model-select" aria-label="Select chat model"></select>
      <div id="chat-history" aria-live="polite"></div>
      <div id="prompt-container">
        <input type="text" id="prompt-input" placeholder="Enter your prompt here..." aria-label="Enter your prompt">
        <button id="send-button" class="button">
          <i class="fas fa-paper-plane"></i> Send
        </button>
      </div>
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      const modelSelect = document.getElementById('model-select');
      const sendButton = document.getElementById('send-button');
      const chatHistory = document.getElementById('chat-history');
      const promptInput = document.getElementById('prompt-input');
      const apiKeyInput = document.getElementById('api-key-input');
      const saveApiKeyButton = document.getElementById('save-api-key');
      const deleteApiKeyButton = document.getElementById('delete-api-key');
      const apiKeyStatus = document.getElementById('api-key-status');

      vscode.postMessage({ command: 'checkApiKey' });
      vscode.postMessage({ command: 'getModels' });

      window.addEventListener('message', (event) => {
        const { command, data, message, status } = event.data;

        switch (command) {
          case 'populateModels':
            modelSelect.innerHTML = data.map(model => 
              \`<option value="\${model}">\${model}</option>\`
            ).join('');
            break;
          case 'responseChunk':
            let assistantMessage = chatHistory.querySelector('.assistant-message:last-child');
            if (!assistantMessage || assistantMessage.getAttribute('data-complete') === 'true') {
              assistantMessage = document.createElement('div');
              assistantMessage.className = 'message assistant-message';
              chatHistory.appendChild(assistantMessage);
            }
            assistantMessage.textContent += data;
            chatHistory.scrollTop = chatHistory.scrollHeight;
            break;
          case 'error':
            vscode.postMessage({ command: 'showError', message: message });
            break;
          case 'apiKeyStatus':
            updateApiKeyStatus(status);
            break;
          case 'apiKeySaved':
            updateApiKeyStatus(true);
            apiKeyInput.value = '';
            vscode.postMessage({ command: 'showInfo', message: 'API key saved successfully.' });
            break;
          case 'apiKeyDeleted':
            updateApiKeyStatus(false);
            vscode.postMessage({ command: 'showInfo', message: 'API key deleted successfully.' });
            break;
        }
      });

      function updateApiKeyStatus(isSet) {
        apiKeyStatus.textContent = isSet ? 'API Key: Set' : 'API Key: Not Set';
        apiKeyStatus.style.color = isSet ? 'var(--vscode-textLink-activeForeground)' : 'var(--vscode-errorForeground)';
      }

      sendButton.addEventListener('click', () => {
        const model = modelSelect.value;
        const prompt = promptInput.value;
        if (!prompt) {
          vscode.postMessage({ command: 'showError', message: 'Please enter a prompt!' });
          return;
        }
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.textContent = prompt;
        chatHistory.appendChild(userMessage);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        promptInput.value = '';
        vscode.postMessage({ command: 'sendPrompt', model, prompt });
      });

      promptInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendButton.click();
        }
      });

      saveApiKeyButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value;
        if (!apiKey) {
          vscode.postMessage({ command: 'showError', message: 'Please enter an API key!' });
          return;
        }
        vscode.postMessage({ command: 'saveApiKey', apiKey });
      });

      deleteApiKeyButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'deleteApiKey' });
      });
    </script>
  </body>
  </html>
  `;
  }