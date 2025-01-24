import * as vscode from 'vscode';

export class TreeViewProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = 
    new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): TreeItem[] {
    return [
      new TreeItem('Open Chat', 'qbraid-chat.openChat', 'comment-discussion'),
      new TreeItem('Set API Key', 'qbraid-chat.setApiKey', 'key'),
      new TreeItem('Delete API Key', 'qbraid-chat.deleteApiKey', 'trashcan'),
    ];
  }
}

class TreeItem extends vscode.TreeItem {
  constructor(label: string, commandId: string, iconName: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.command = {
      command: commandId,
      title: label,
    };
    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}
