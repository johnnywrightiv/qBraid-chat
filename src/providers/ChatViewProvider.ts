import * as vscode from "vscode";
import { ApiService } from "../services/ApiService";
import { ApiKeyManager } from "../managers/ApiKeyManager";
import { getWebviewContent } from "../views/webview";

export class ChatViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = getWebviewContent();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "getModels":
          await this.handleGetModels(webviewView);
          break;
        case "sendPrompt":
          await this.handleSendPrompt(webviewView, message);
          break;
        case "checkApiKey":
          await this.handleCheckApiKey(webviewView);
          break;
        case "saveApiKey":
          await this.handleSaveApiKey(webviewView, message);
          break;
        case "deleteApiKey":
          await this.handleDeleteApiKey(webviewView);
          break;
      }
    });
  }

  private async handleCheckApiKey(webviewView: vscode.WebviewView) {
    const apiKey = await ApiKeyManager.getApiKey();
    webviewView.webview.postMessage({ command: "apiKeyStatus", status: !!apiKey });
  }

  private async handleSaveApiKey(webviewView: vscode.WebviewView, message: any) {
    await ApiKeyManager.storeApiKey(message.apiKey);
    webviewView.webview.postMessage({ command: "apiKeySaved" });
  }

  private async handleDeleteApiKey(webviewView: vscode.WebviewView) {
    const apiKeyManager = new ApiKeyManager();
    await apiKeyManager.deleteApiKey();
    webviewView.webview.postMessage({ command: "apiKeyDeleted" });
  }

  private async handleGetModels(webviewView: vscode.WebviewView) {
    const apiKey = await ApiKeyManager.getApiKey();
    if (!apiKey) {
      webviewView.webview.postMessage({
        command: "error",
        message: "API Key is missing!",
      });
      return;
    }

    try {
      const models = await ApiService.getModels(apiKey);
      const modelNames = models.map((model: any) => model.model);
      webviewView.webview.postMessage({
        command: "populateModels",
        data: modelNames,
      });
    } catch (error) {
      webviewView.webview.postMessage({
        command: "error",
        message: "Failed to fetch models.",
      });
    }
  }

  private async handleSendPrompt(webviewView: vscode.WebviewView, message: any) {
    const apiKey = await ApiKeyManager.getApiKey();
    if (!apiKey) {
      webviewView.webview.postMessage({
        command: "error",
        message: "API Key is missing!",
      });
      return;
    }

    const { model, prompt } = message;

    try {
      if (prompt.toLowerCase().includes("job")) {
        await this.handleJobsQuery(webviewView, apiKey);
      } else if (prompt.toLowerCase().includes("device")) {
        await this.handleDevicesQuery(webviewView, apiKey);
      } else {
        await ApiService.sendChat(apiKey, prompt, model, (chunk) => {
          webviewView.webview.postMessage({
            command: "responseChunk",
            data: chunk,
          });
        });
      }
    } catch (error) {
      webviewView.webview.postMessage({ command: "error", message: error });
    }
  }

  private async handleJobsQuery(webviewView: vscode.WebviewView, apiKey: string) {
    const jobs = await ApiService.getQuantumJobsStatus(apiKey);
    if (jobs.length === 0) {
      webviewView.webview.postMessage({
        command: "responseChunk",
        data: "No active quantum jobs found.",
      });
    } else {
      for (const job of jobs) {
        const jobText = `Job ID: ${job.qbraidJobId}, Status: ${job.status}, Created At: ${job.timeStamps.createdAt}`;
        webviewView.webview.postMessage({
          command: "responseChunk",
          data: jobText,
        });
        await this.delay(100);
      }
    }
  }

  private async handleDevicesQuery(
    webviewView: vscode.WebviewView,
    apiKey: string
  ) {
    const devices = await ApiService.getQuantumDevicesStatus(apiKey);
    if (devices.length === 0) {
      webviewView.webview.postMessage({
        command: "responseChunk",
        data: "No devices found.",
      });
    } else {
      webviewView.webview.postMessage({
        command: "responseChunk",
        data: "qBraid Quantum Devices:",
      });

      for (const device of devices) {
        const deviceText = ` • Device: ${device.name}, Status: ${device.status}, Available: ${
          device.isAvailable ? "Yes" : "No"
        }`;
        webviewView.webview.postMessage({
          command: "responseChunk",
          data: deviceText,
        });
        await this.delay(100);
      }
    }
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}