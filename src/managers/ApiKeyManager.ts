import * as vscode from "vscode";

export class ApiKeyManager {
  static async getApiKey(): Promise<string | undefined> {
    return vscode.workspace.getConfiguration().get("qbraid.apiKey") as string;
  }

  static async storeApiKey(apiKey: string): Promise<void> {
    await vscode.workspace
      .getConfiguration()
      .update("qbraid.apiKey", apiKey, vscode.ConfigurationTarget.Global);
  }

  static async promptForApiKey(): Promise<string | undefined> {
    const apiKey = await vscode.window.showInputBox({
      prompt: "Enter your qBraid API key",
      placeHolder: "API key",
      password: true,
    });

    if (!apiKey) {
      vscode.window.showErrorMessage("API key is required!");
      return undefined;
    }

    return apiKey;
  }

  async deleteApiKey(): Promise<void> {
    const confirmation = await vscode.window.showWarningMessage(
      "Are you sure you want to delete your qBraid API key?",
      "Yes",
      "No"
    );

    if (confirmation === "Yes") {
      await vscode.workspace
        .getConfiguration()
        .update("qbraid.apiKey", undefined, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage("API key has been deleted.");
    }
  }
}