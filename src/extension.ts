import * as vscode from "vscode"
import {
  getApiKey,
  storeApiKey,
  promptForApiKey,
  deleteApiKey,
  sendChat,
  getModels,
} from "./commands/apiHelpers"

let statusBarItem: vscode.StatusBarItem

export function activate(context: vscode.ExtensionContext) {
  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
  context.subscriptions.push(statusBarItem)

  // Check for API key on activation
  checkApiKey()

  // Register Webview View Provider
  const provider = new ChatViewProvider(context)
  context.subscriptions.push(vscode.window.registerWebviewViewProvider("chatView", provider))

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("qbraid-chat.setApiKey", setApiKey),
    vscode.commands.registerCommand("qbraid-chat.deleteApiKey", deleteApiKey),
  )
}

async function checkApiKey() {
  const apiKey = await getApiKey()
  if (apiKey) {
    updateStatusBar(true)
  } else {
    updateStatusBar(false)
    const result = await vscode.window.showInformationMessage(
      "No API key found for qBraid Chat. Would you like to set it now?",
      "Yes",
      "No",
    )
    if (result === "Yes") {
      await setApiKey()
    }
  }
}

async function setApiKey() {
  const apiKey = await promptForApiKey()
  if (apiKey) {
    await storeApiKey(apiKey)
    updateStatusBar(true)
  }
}

function updateStatusBar(isConnected: boolean) {
  if (isConnected) {
    statusBarItem.text = "qBraid: Connected"
    statusBarItem.tooltip = "qBraid API is connected"
  } else {
    statusBarItem.text = "qBraid: No API key set"
    statusBarItem.tooltip = "Click to set qBraid API key"
    statusBarItem.command = "qbraid-chat.setApiKey"
  }
  statusBarItem.show()
}

class ChatViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    }

    webviewView.webview.html = this.getWebviewContent()

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "getModels":
          await this.handleGetModels(webviewView)
          break
        case "sendPrompt":
          await this.handleSendPrompt(webviewView, message)
          break
        case "checkApiKey":
          await this.handleCheckApiKey(webviewView)
          break
        case "saveApiKey":
          await this.handleSaveApiKey(webviewView, message)
          break
        case "deleteApiKey":
          await this.handleDeleteApiKey(webviewView)
          break
      }
    })
  }

  private async handleGetModels(webviewView: vscode.WebviewView) {
    const apiKey = await getApiKey()
    if (!apiKey) {
      webviewView.webview.postMessage({ command: "error", message: "API Key is missing!" })
      return
    }

    try {
      const models = await getModels(apiKey)
      const modelNames = models.map((model: any) => model.model)
      webviewView.webview.postMessage({ command: "populateModels", data: modelNames })
    } catch (error) {
      webviewView.webview.postMessage({ command: "error", message: "Failed to fetch models." })
    }
  }

  private async handleSendPrompt(webviewView: vscode.WebviewView, message: any) {
    const apiKey = await getApiKey();
    if (!apiKey) {
      webviewView.webview.postMessage({ command: 'error', message: 'API Key is missing!' });
      return;
    }

    const { model, prompt } = message;

    try {
      await sendChat(apiKey, prompt, model, (chunk) => {
        webviewView.webview.postMessage({ command: 'responseChunk', data: chunk });
      });
    } catch (error) {
      webviewView.webview.postMessage({ command: 'error', message: 'Failed to send prompt.' });
    }
  }

  private async handleCheckApiKey(webviewView: vscode.WebviewView) {
    const apiKey = await getApiKey()
    webviewView.webview.postMessage({ command: "apiKeyStatus", status: !!apiKey })
  }

  private async handleSaveApiKey(webviewView: vscode.WebviewView, message: any) {
    const apiKey = message.apiKey
    await storeApiKey(apiKey)
    updateStatusBar(true)
    webviewView.webview.postMessage({ command: "apiKeySaved" })
  }

  private async handleDeleteApiKey(webviewView: vscode.WebviewView) {
    await deleteApiKey()
    updateStatusBar(false)
    webviewView.webview.postMessage({ command: "apiKeyDeleted" })
  }

  private getWebviewContent(): string {
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
          --send-button-bg: #db0c81; /* Custom button background color */
          --send-button-bg-hover: #a810c2; /* Custom button hover color */
        }

        body {
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background/50);
          margin: 0;
          display: flex;
          flex-direction: column;
          height: 90vh;
          padding: 20px;
        }
        .container {
          display: flex;
          flex-direction: column;
          height: 100%;
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
          height: 40px; /* Smaller height */
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
          max-width: 80%;
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
              assistantMessage.textContent += data; // Append incoming chunk
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
}

