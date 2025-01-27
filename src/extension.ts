import * as vscode from "vscode";
import { ChatViewProvider } from "./providers/ChatViewProvider";
import { StatusBarManager } from "./managers/StatusBarManager";
import { ApiKeyManager } from "./managers/ApiKeyManager";

let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
  statusBarManager = new StatusBarManager(context);
  const apiKeyManager = new ApiKeyManager();
  
  checkApiKey();
  
  const provider = new ChatViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("chatView", provider),
    vscode.commands.registerCommand("qbraid-chat.setApiKey", () => setApiKey()),
    vscode.commands.registerCommand("qbraid-chat.deleteApiKey", () => apiKeyManager.deleteApiKey())
  );
}

async function checkApiKey() {
  const apiKey = await ApiKeyManager.getApiKey();
  if (apiKey) {
    statusBarManager.updateStatus(true);
  } else {
    statusBarManager.updateStatus(false);
    const result = await vscode.window.showInformationMessage(
      "No API key found for qBraid Chat. Would you like to set it now?",
      "Yes",
      "No"
    );
    if (result === "Yes") {
      await setApiKey();
    }
  }
}

async function setApiKey() {
  const apiKey = await ApiKeyManager.promptForApiKey();
  if (apiKey) {
    await ApiKeyManager.storeApiKey(apiKey);
    statusBarManager.updateStatus(true);
  }
}

export function deactivate() {
  statusBarManager.dispose();
}