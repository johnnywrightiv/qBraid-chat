import * as vscode from "vscode";

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    context.subscriptions.push(this.statusBarItem);
  }

  updateStatus(isConnected: boolean) {
    if (isConnected) {
      this.statusBarItem.text = "qBraid: Connected";
      this.statusBarItem.tooltip = "qBraid API is connected";
    } else {
      this.statusBarItem.text = "qBraid: No API key set";
      this.statusBarItem.tooltip = "Click to set qBraid API key";
      this.statusBarItem.command = "qbraid-chat.setApiKey";
    }
    this.statusBarItem.show();
  }

  dispose() {
    this.statusBarItem.dispose();
  }
}