import * as vscode from 'vscode';
import axios from 'axios';

// Function to get the API key from workspace settings
export async function getApiKey(): Promise<string | undefined> {
  return vscode.workspace.getConfiguration().get('qbraid.apiKey') as string;
}

// Function to store the API key securely in settings
export async function storeApiKey(apiKey: string): Promise<void> {
  await vscode.workspace
    .getConfiguration()
    .update('qbraid.apiKey', apiKey, vscode.ConfigurationTarget.Global);
}

// Function to prompt for API key input
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

// Function to delete the API key
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

// Function to validate the API key with qBraid API
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

// Function to send POST request to qBraid API
export async function sendPostRequest(apiKey: string | undefined, prompt: string, model: string = 'gpt-4o-mini') {
  try {
    const response = await axios.post(
      'https://api.qbraid.com/api/chat',
      { prompt: prompt, model: model, stream: false },
      { headers: { 'api-key': apiKey, 'Content-Type': 'application/json' } }
    );
    
    // Directly use the content field
    const responseContent = response.data.content;
    const tokenUsage = response.data.usage;
    
    vscode.window.showInformationMessage(`Response: ${responseContent}`);
    
    // Optional: Show token usage details
    console.log('Token Usage:', tokenUsage);
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      vscode.window.showErrorMessage(`Request failed: ${error.response?.data?.message || error.message}`);
    } else {
      vscode.window.showErrorMessage(`Unexpected error: ${error}`);
    }
  }
}

// Function to send GET request to qBraid API for model selection
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

    vscode.window.showInformationMessage(`Available Models:\n${modelDetails.join('\n')}`);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      vscode.window.showErrorMessage(`Request failed: ${error.response?.data?.message || error.message}`);
    } else {
      vscode.window.showErrorMessage(`Unexpected error: ${error}`);
    }
  }
}
