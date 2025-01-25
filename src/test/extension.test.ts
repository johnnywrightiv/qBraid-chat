import * as assert from 'assert';
import * as vscode from 'vscode';
import * as extension from '../extension';

suite('Extension Tests', () => {  
	test('should execute the getModels command and show a message', async () => {
		const response = await vscode.commands.executeCommand(
			'qbraid-chat.getModels'
		);
		assert.strictEqual(response, undefined); 
	});

	test('should execute the sendPrompt command and show a message', async () => {
		const prompt = 'What quantum devices available through qBraid are currently online and available?';
		
		const inputBoxStub = vscode.window.showInputBox as jest.Mock;
		inputBoxStub.mockResolvedValue(prompt);

		const response = await vscode.commands.executeCommand(
			'qbraid-chat.sendPrompt'
		);
		assert.strictEqual(response, undefined); 
	});
});
