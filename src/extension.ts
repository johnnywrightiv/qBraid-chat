import * as vscode from 'vscode';
import { TreeViewProvider } from './commands/TreeViewProvider';
import {
  getApiKey,
  validateApiKey,
  sendChat,
  getModels,
  promptForApiKey,
  deleteApiKey,
} from './commands/apiHelpers';

function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>qBraid Chat</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 10px;
          background-color: #f4f4f4;
        }
        #model-select {
          margin-bottom: 10px;
        }
        #prompt-input {
          width: 100%;
          height: 50px;
          margin-bottom: 10px;
        }
        #send-button {
          background-color: #007acc;
          color: white;
          border: none;
          padding: 10px;
          cursor: pointer;
        }
        #send-button:hover {
          background-color: #005f9c;
        }
        #response {
          margin-top: 20px;
          padding: 10px;
          background-color: #fff;
          border: 1px solid #ddd;
        }
      </style>
    </head>
    <body>
      <h1>qBraid Chat</h1>
      <select id="model-select"></select>
      <textarea id="prompt-input" placeholder="Enter your prompt here..."></textarea>
      <button id="send-button">Send</button>
      <div id="response"></div>
      <script>
        const vscode = acquireVsCodeApi();
        const modelSelect = document.getElementById('model-select');
        const sendButton = document.getElementById('send-button');
        const responseDiv = document.getElementById('response');

        // Fetch models
        vscode.postMessage({ command: 'getModels' });

        window.addEventListener('message', (event) => {
          const { command, data } = event.data;

          if (command === 'populateModels') {
            modelSelect.innerHTML = data.map(model => 
              \`<option value="\${model}">\${model}</option>\`
            ).join('');
          }

          if (command === 'response') {
            responseDiv.innerHTML = \`<strong>Response:</strong> <pre>\${data}</pre>\`;
          }
        });

        sendButton.addEventListener('click', () => {
          const model = modelSelect.value;
          const prompt = document.getElementById('prompt-input').value;
          if (!prompt) {
            alert('Please enter a prompt!');
            return;
          }
          vscode.postMessage({ command: 'sendPrompt', model, prompt });
        });
      </script>
    </body>
    </html>
  `;
}


export function activate(context: vscode.ExtensionContext) {
  // Initialize status bar
  const apiKeyStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  context.subscriptions.push(apiKeyStatusBarItem);

  const updateApiKeyStatus = async () => {
    const apiKey = await getApiKey();

    if (apiKey) {
      apiKeyStatusBarItem.text = `qBraid: $(key) API Key Set`;
      apiKeyStatusBarItem.tooltip = 'Click to remove API Key';
      apiKeyStatusBarItem.command = 'qbraid-chat.deleteApiKey';
    } else {
      apiKeyStatusBarItem.text = `qBraid: $(key) No API Key Set`;
      apiKeyStatusBarItem.tooltip = 'Click to add API Key';
      apiKeyStatusBarItem.command = 'qbraid-chat.setApiKey';
    }

    apiKeyStatusBarItem.show();
  };

  // Register Tree View Provider
  const qbraidTreeProvider = new TreeViewProvider();
  vscode.window.registerTreeDataProvider('qbraidView', qbraidTreeProvider);

  // Optional: Command to refresh the tree view
  const refreshTreeCommand = vscode.commands.registerCommand('qbraid-chat.refreshView', () => {
    qbraidTreeProvider['_onDidChangeTreeData'].fire();
  });

  context.subscriptions.push(refreshTreeCommand);

  // Commands
  const openChatCommand = vscode.commands.registerCommand('qbraid-chat.openChat', () => {
    const panel = vscode.window.createWebviewPanel(
      'qbraidChat',
      'qBraid Chat',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'getModels') {
        const apiKey = await getApiKey();
        if (!apiKey) {
          panel.webview.postMessage({ command: 'error', message: 'API Key is missing!' });
          return;
        }

        const models = await getModels(apiKey);
        const modelNames = models.map((model: any) => model.model);
        panel.webview.postMessage({ command: 'populateModels', data: modelNames });
      }

      if (message.command === 'sendPrompt') {
        const apiKey = await getApiKey();
        if (!apiKey) {
          panel.webview.postMessage({ command: 'error', message: 'API Key is missing!' });
          return;
        }

        const { model, prompt } = message;
        const response = await sendChat(apiKey, prompt, model);
        panel.webview.postMessage({ command: 'response', data: response.content });
      }
    });
  });

  const getDataCommand = vscode.commands.registerCommand('qbraid-chat.getData', async () => {
    const apiKey = await getApiKey();

    if (!apiKey) {
      vscode.window.showErrorMessage('No API key found. Please set your API key first.');
      return;
    }

    const isValid = await validateApiKey(apiKey);

    if (isValid) {
      try {
        const response = await vscode.window.showInformationMessage('Data: Fetched!');
        console.log(response)
      } catch (error) {
        vscode.window.showErrorMessage(`Request failed: ${error}`);
      }
    } else {
      vscode.window.showErrorMessage('Invalid API key. Please check your API key and try again.');
    }
  });

  const sendPromptCommand = vscode.commands.registerCommand('qbraid-chat.sendPrompt', async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      vscode.window.showErrorMessage('API Key is required!');
      return;
    }

    const prompt = await vscode.window.showInputBox({
      prompt: 'Enter your prompt for qBraid AI (e.g., "What quantum devices available through qBraid are currently online and available?")',
      placeHolder: 'Your prompt...',
    });

    if (prompt) {
      await sendChat(apiKey, prompt);
    } else {
      vscode.window.showErrorMessage('You must provide a prompt!');
    }
  });

  const getModelsCommand = vscode.commands.registerCommand('qbraid-chat.getModels', async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      vscode.window.showErrorMessage('API Key is required!');
      return;
    }
    await getModels(apiKey);
  });

  const setKeyCommand = vscode.commands.registerCommand('qbraid-chat.setApiKey', async () => {
    await promptForApiKey();
    updateApiKeyStatus();
  });

  const deleteKeyCommand = vscode.commands.registerCommand('qbraid-chat.deleteApiKey', async () => {
    await deleteApiKey();
    updateApiKeyStatus();
  });

  // Register commands
  context.subscriptions.push(
    openChatCommand,
    getDataCommand,
    sendPromptCommand,
    getModelsCommand,
    setKeyCommand,
    deleteKeyCommand,
  );

  // Update status bar on activation
  updateApiKeyStatus();
}

export function deactivate() {}
