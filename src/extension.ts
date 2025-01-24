import * as vscode from 'vscode';
import { TreeViewProvider } from './commands/TreeViewProvider';
import {
  getApiKey,
  validateApiKey,
  sendPostRequest,
  getModels,
  promptForApiKey,
  deleteApiKey,
} from './commands/apiHelpers';

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
      await sendPostRequest(apiKey, prompt);
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
