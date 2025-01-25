import * as vscode from 'vscode';
import axios from 'axios';

export async function getApiKey(): Promise<string | undefined> {
  return vscode.workspace.getConfiguration().get('qbraid.apiKey') as string;
}

export async function storeApiKey(apiKey: string): Promise<void> {
  await vscode.workspace
    .getConfiguration()
    .update('qbraid.apiKey', apiKey, vscode.ConfigurationTarget.Global);
}

export async function promptForApiKey(): Promise<string | undefined> {
  const apiKey = await vscode.window.showInputBox({
    prompt: 'Enter your qBraid API key',
    placeHolder: 'API key',
    password: true, // Mask input
  });

  if (apiKey) {
    await storeApiKey(apiKey);
    vscode.window.showInformationMessage('API key added successfully.');
    return apiKey;
  }

  vscode.window.showErrorMessage('API key is required!');
  return undefined;
}

export async function deleteApiKey(): Promise<void> {
  const confirmation = await vscode.window.showWarningMessage(
    'Are you sure you want to delete your qBraid API key?',
    'Yes',
    'No'
  );

  if (confirmation === 'Yes') {
    await vscode.workspace
      .getConfiguration()
      .update('qbraid.apiKey', undefined, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage('API key has been deleted.');
  }
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const options = {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'validate',
        model: 'gpt-4o-mini',
        stream: false,
      }),
    };

    const response = await fetch('https://api.qbraid.com/api/chat', options);

    if (!response.ok) {
      throw new Error('Invalid API key');
    }

    const data = await response.json();
    return data ? true : false;
  } catch (error) {
    return false;
  }
}

export async function getModels(apiKey: string) {
  try {
    const response = await axios.get(
      'https://api.qbraid.com/api/chat/models',
      {
        headers: {
          'api-key': apiKey,
        },
      }
    );

    // Correctly extract model details
    const modelDetails = response.data.map((model: any) => 
      `${model.model}, `
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      vscode.window.showErrorMessage(`Request failed: ${error.response?.data?.message || error.message}`);
    } else {
      vscode.window.showErrorMessage(`Unexpected error: ${error}`);
    }
  }
}

export async function sendChat(apiKey: string, prompt: string, model: string, onChunk: (chunk: string) => void) {
  const response = await fetch('https://api.qbraid.com/api/chat', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, model, stream: true }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk); // Send the chunk to the handler
  }
}