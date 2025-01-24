// NOTE: We're storing the API key in settings.json for simplicity and testing purposes.
// In production, consider using `vscode.secrets` for securely storing API keys. 
// 'https://jsonplaceholder.typicode.com/posts/1', 

import * as vscode from 'vscode';
import axios from 'axios';

// Function to get the API key (from settings)
async function getApiKey(): Promise<string | undefined> {
	return vscode.workspace.getConfiguration().get('qbraid.apiKey') as string;
}

// Function to store the API key securely in settings
async function storeApiKey(apiKey: string): Promise<void> {
	await vscode.workspace
		.getConfiguration()
		.update('qbraid.apiKey', apiKey, vscode.ConfigurationTarget.Global);
}

// Function to prompt the user for their API key
async function promptForApiKey(): Promise<string | undefined> {
	const apiKey = await vscode.window.showInputBox({
		prompt: 'Enter your qBraid API key',
		placeHolder: 'API key',
		password: true, // Mask the input (sensitive info)
	});

	if (apiKey) {
		await storeApiKey(apiKey); // Store it securely in settings
		vscode.window.showInformationMessage('API key added successfully.');
		return apiKey;
	}

	vscode.window.showErrorMessage('API key is required!');
	return undefined;
}

// Function to delete the API key from settings
async function deleteApiKey(): Promise<void> {
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
	} else {
		vscode.window.showInformationMessage('API key deletion canceled.');
	}
}

// Function to validate the API key with qBraid
async function validateApiKey(apiKey: string): Promise<boolean> {
	try {
		const options = {
			method: 'POST',
			headers: {
				'api-key': apiKey, // Use the API key directly here as 'api-key' header
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				prompt: 'validate',
				model: 'gpt-4o-mini',
				stream: false,
			}), // Using a test prompt
		};

		const response = await fetch('https://api.qbraid.com/api/chat', options);

		if (!response.ok) {
			throw new Error('Invalid API key');
		}

		// If status is 200, it means the API key is valid
		const data = await response.json();
		return data ? true : false; // If response is valid, return true
	} catch (error) {
		// If there's an error (invalid API key), we handle it here
		return false;
	}
}

// Function to send POST request to qBraid API with a user prompt
async function sendPostRequest(apiKey: string, prompt: string) {
    try {
        const response = await axios.post(
            'https://api.qbraid.com/api/chat',
            {
                prompt: prompt,
                model: 'gpt-4o-mini',
                stream: false,
            },
            {
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Display API response in WebView
        showWebView(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            vscode.window.showErrorMessage(`Request failed: ${error.response?.data?.message || error.message}`);
        } else {
            vscode.window.showErrorMessage(`Unexpected error: ${error}`);
        }
    }
}

// Function to send GET request to qBraid API for model selection
async function getModels(apiKey: string) {
    try {
        const response = await axios.get(
            'https://api.qbraid.com/api/chat/models', // qBraid models endpoint
            {
                headers: {
                    'api-key': apiKey,
                },
            }
        );

        // Display models in a WebView
        showWebView(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            vscode.window.showErrorMessage(`Request failed: ${error.response?.data?.message || error.message}`);
        } else {
            vscode.window.showErrorMessage(`Unexpected error: ${error}`);
        }
    }
}

// New function to handle sending prompt to qBraid API
async function sendPromptToApi() {
	const apiKey = await getApiKey();
	if (!apiKey) {
		vscode.window.showErrorMessage('API Key is required!');
		return;
	}

	const prompt = await vscode.window.showInputBox({
		prompt: 'Enter your prompt for qBraid AI (e.g., "Tell me a joke")',
		placeHolder: 'Your prompt...',
	});

	if (prompt) {
		await sendPostRequest(apiKey, prompt); // Send the prompt to the API
	} else {
		vscode.window.showErrorMessage('You must provide a prompt!');
	}
}

// Function to get data after validating the API key
async function getData(): Promise<void> {
	const apiKey = await getApiKey();

	if (!apiKey) {
		vscode.window.showErrorMessage(
			'No API key found. Please set your API key first.'
		);
		return;
	}

	// Validate API key with qBraid
	const isValid = await validateApiKey(apiKey);

	if (isValid) {
		try {
			const response = await axios.get(
				'https://jsonplaceholder.typicode.com/posts/1', // Placeholder endpoint for now, replace with actual qBraid endpoint
				{
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
				}
			);

			vscode.window.showInformationMessage(`Data: ${response.data.title}`);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				vscode.window.showErrorMessage(
					`Request failed: ${error.response?.data?.message || error.message}`
				);
			} else {
				vscode.window.showErrorMessage(`Unexpected error: ${error}`);
			}
		}
	} else {
		vscode.window.showErrorMessage(
			'Invalid API key. Please check your API key and try again.'
		);
	}
}

// Function to update the status bar based on the API key
async function updateApiKeyStatus(statusBarItem: vscode.StatusBarItem) {
	const apiKey = await getApiKey();

	if (apiKey) {
		statusBarItem.text = `qBraid: $(key) API Key Set`;
		statusBarItem.tooltip = 'Click to remove API Key';
		statusBarItem.command = 'qbraid-chat.deleteApiKey'; // Set to delete the key when clicked
	} else {
		statusBarItem.text = `qBraid: $(key) No API Key Set`;
		statusBarItem.tooltip = 'Click to add API Key';
		statusBarItem.command = 'qbraid-chat.setApiKey'; // Set to add the key when clicked
	}

	statusBarItem.show();
}

// Create a new Webview to show extension GUI
async function showWebView(responseData: any) {
	const panel = vscode.window.createWebviewPanel(
		'qbraidApiResponse', // ID for the view
		'qBraid API Response', // Title
		vscode.ViewColumn.One, // Show in the first editor column
		{
			enableScripts: true, // Allow running scripts if necessary
		}
	);

	// Prepare content for the WebView (response data formatted in JSON)
	panel.webview.html = `
		<html>
			<body>
				<h1>API Response</h1>
				<pre>${JSON.stringify(responseData, null, 2)}</pre>
			</body>
		</html>
	`;
}

export function activate(context: vscode.ExtensionContext) {
  const apiKeyStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  context.subscriptions.push(apiKeyStatusBarItem);

  const updateApiKeyStatus = async () => {
    const apiKey = await getApiKey();

    if (apiKey) {
      apiKeyStatusBarItem.text = `qBraid: $(key) API Key Set`;
      apiKeyStatusBarItem.tooltip = 'Click to remove API Key';
      apiKeyStatusBarItem.command = 'qbraid-chat.deleteApiKey'; // Set to delete the key when clicked
    } else {
      apiKeyStatusBarItem.text = `qBraid: $(key) No API Key Set`;
      apiKeyStatusBarItem.tooltip = 'Click to add API Key';
      apiKeyStatusBarItem.command = 'qbraid-chat.setApiKey'; // Set to add the key when clicked
    }

    apiKeyStatusBarItem.show();
  };

  // Command to handle the getData API request (for placeholder testing)
  const getDataCommand = vscode.commands.registerCommand('qbraid-chat.getData', async () => {
    const apiKey = await getApiKey();

    if (!apiKey) {
      vscode.window.showErrorMessage('No API key found. Please set your API key first.');
      return;
    }

    // Validate API key with qBraid
    const isValid = await validateApiKey(apiKey);

    if (isValid) {
      try {
        // Placeholder GET request to show test data
        const response = await axios.get('https://jsonplaceholder.typicode.com/posts/1', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        vscode.window.showInformationMessage(`Data: ${response.data.title}`);
      } catch (error) {
        vscode.window.showErrorMessage(`Request failed: ${error}`);
      }
    } else {
      vscode.window.showErrorMessage('Invalid API key. Please check your API key and try again.');
    }
  });

  // Command to send the user's prompt to the qBraid API (POST)
  const sendPromptCommand = vscode.commands.registerCommand('qbraid-chat.sendPrompt', async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      vscode.window.showErrorMessage('API Key is required!');
      return;
    }

    const prompt = await vscode.window.showInputBox({
      prompt: 'Enter your prompt for qBraid AI (e.g., "Tell me a joke")',
      placeHolder: 'Your prompt...',
    });

    if (prompt) {
      await sendPostRequest(apiKey, prompt); // Send the prompt to the API
    } else {
      vscode.window.showErrorMessage('You must provide a prompt!');
    }
  });

  // Command to show available models
  const getModelsCommand = vscode.commands.registerCommand('qbraid-chat.getModels', async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      vscode.window.showErrorMessage('API Key is required!');
      return;
    }
    await getModels(apiKey); // Fetch models using the GET request
  });

  // Command to set or update the API key
  const setKeyCommand = vscode.commands.registerCommand('qbraid-chat.setApiKey', async () => {
    await promptForApiKey();
    updateApiKeyStatus(); // Update status bar after setting key
  });

  // Command to delete the API key
  const deleteKeyCommand = vscode.commands.registerCommand('qbraid-chat.deleteApiKey', async () => {
    await deleteApiKey();
    updateApiKeyStatus(); // Update status bar after deleting key
  });

  // Register all commands
  context.subscriptions.push(
    getDataCommand,
    sendPromptCommand,
    getModelsCommand,
    setKeyCommand,
    deleteKeyCommand
  );

  // Initial status bar update
  updateApiKeyStatus();
}

export function deactivate() {}
