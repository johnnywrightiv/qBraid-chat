import axios from "axios";
import * as vscode from "vscode";

export class ApiService {
  private static readonly BASE_URL = "https://api.qbraid.com/api";

  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/chat`,
        {
          prompt: "validate",
          model: "gpt-4o-mini",
          stream: false,
        },
        {
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
          },
        }
      );
      return !!response.data;
    } catch (error) {
      return false;
    }
  }

  static async getModels(apiKey: string) {
    try {
      const response = await axios.get(`${this.BASE_URL}/chat/models`, {
        headers: { "api-key": apiKey },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  static async getQuantumDevicesStatus(apiKey: string) {
    try {
      const response = await axios.get(`${this.BASE_URL}/quantum-devices`, {
        headers: { "api-key": apiKey },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching device status:", error);
      throw new Error("Failed to retrieve device status");
    }
  }

  static async getQuantumJobsStatus(apiKey: string) {
    try {
      const response = await axios.get(`${this.BASE_URL}/quantum-jobs`, {
        headers: { "api-key": apiKey },
      });
      return response.data.jobsArray;
    } catch (error) {
      console.error("Error fetching job status:", error);
      throw new Error("Failed to retrieve job status");
    }
  }

  static async sendChat(
    apiKey: string,
    prompt: string,
    model: string,
    onChunk: (chunk: string) => void
  ) {
    const response = await fetch(`${this.BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, model, stream: true }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  }

  private static handleError(error: any) {
    if (axios.isAxiosError(error)) {
      vscode.window.showErrorMessage(
        `Request failed: ${error.response?.data?.message || error.message}`
      );
    } else {
      vscode.window.showErrorMessage(`Unexpected error: ${error}`);
    }
  }
}