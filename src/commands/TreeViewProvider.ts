import * as vscode from 'vscode';

export class TreeViewProvider implements vscode.TreeDataProvider<QbraidItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<QbraidItem | undefined | null | void> =
    new vscode.EventEmitter<QbraidItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<QbraidItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: QbraidItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: QbraidItem): QbraidItem[] {
    if (element) {
      return [];
    }

    return [
      new QbraidItem('Set API Key', 'qbraid-chat.setApiKey', 'key'),
      new QbraidItem('Get Models', 'qbraid-chat.getModels', 'list-unordered'),
      new QbraidItem('Send Prompt', 'qbraid-chat.sendPrompt', 'rocket'),
      new QbraidItem('Delete API Key', 'qbraid-chat.deleteApiKey', 'trashcan'),
    ];
  }
}

export class QbraidItem extends vscode.TreeItem {
  constructor(label: string, commandId: string, iconName: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.command = {
      command: commandId,
      title: label,
    };

    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}
