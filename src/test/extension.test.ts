import * as assert from 'assert';
import * as vscode from 'vscode';

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

  test('should show input box when sendPrompt is executed', async () => {
    const inputBoxStub = vscode.window.showInputBox as jest.Mock;
    inputBoxStub.mockResolvedValue('test prompt');

    await vscode.commands.executeCommand('qbraid-chat.sendPrompt');
    
    expect(inputBoxStub).toHaveBeenCalledTimes(1);
  });

  test('should handle different user inputs in sendPrompt', async () => {
    const inputBoxStub = vscode.window.showInputBox as jest.Mock;
    
    inputBoxStub.mockResolvedValue('What is the status of the quantum device?');
    const response1 = await vscode.commands.executeCommand('qbraid-chat.sendPrompt');
    expect(response1).toBeUndefined();

    inputBoxStub.mockResolvedValue('List all available quantum devices.');
    const response2 = await vscode.commands.executeCommand('qbraid-chat.sendPrompt');
    expect(response2).toBeUndefined(); 
  });

  test('should show information message after executing sendPrompt command', async () => {
    const showMessageStub = vscode.window.showInformationMessage as jest.Mock;
    
    await vscode.commands.executeCommand('qbraid-chat.sendPrompt');
    
    expect(showMessageStub).toHaveBeenCalledWith(
      expect.stringContaining('Quantum device status updated')
    );
  });
});
