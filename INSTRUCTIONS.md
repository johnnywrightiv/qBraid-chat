## DONE:
[x] Setup project structure
[x] Authenticate with qBraid API
[x] Create commands for API interactions
[x] Create view to run commands in sidebar
[x] Create webviews for UI (chat interface and api key management)
[x] Use getModels to populate the models dropdown
[x] Add logo & Improve chat UI 

## TODO:
[ ] Add skeleton for chat UI
[ ] Stream responses back to the user
[ ] Break up chat functionality into separate files
[ ] Extend the chat functionality to handle real-time server requests to other qBraid API endpoints to answer platform-specific questions


## Goal
Create a Visual Studio Code chat extension that interacts with [qBraid REST API Endpoints](https://docs.qbraid.com/api-reference/user-guide/introduction).

### Level 0: Basic Chat Interface
1. Enable the chat extension to make authenticated requests to the qBraid API with a user's API Key. This can be achieved using:
   - A prompt,
   - A settings tab,
   - Reading directly from a `~/.qbraid/qbraidrc` configuration file,
   - Or any other approach you prefer.
2. Send chat messages via [`POST` `/chat`](https://docs.qbraid.com/api-reference/rest/post-chat) and stream responses back to the user.
3. Allow users to select which model to use based on the models listed by [`GET` `/chat/models`](https://docs.qbraid.com/api-reference/rest/get-chat-models).

### Level 1: Agentic Behavior (Optional)
1. First, complete all tasks in **Level 0**.
2. Extend the chat functionality to handle real-time server requests to other qBraid API endpoints to answer platform-specific questions, such as:
   - "What quantum devices available through qBraid are currently online and available?"
   - "What is the status of the most recent quantum job I submitted to the qBraid QIR simulator?"

## Development Guidelines
- You may develop the extension using any framework(s) that you choose.

## Packaging Requirements
Your project must include a script to package the extension using [`@vscode/vsce`](https://www.npmjs.com/package/@vscode/vsce). The script should generate a `.vsix` file named `qbraid-chat-0.1.0.vsix` in the root directory. Ensure the following commands work as expected:

```bash
npm install
npm run vsce:package
code --install-extension "qbraid-chat-0.1.0.vsix"
```

## Submission Instructions
1. Ensure the following before submission:
   - The `name` field in `package.json` is `"qbraid-chat"`.
   - The `version` field in `package.json` is `"0.1.0"`.
   - The project directory is named `qbraid-chat`.
2. Create a zip file named `qbraid-chat.zip` that excludes unnecessary files:
   ```bash
   zip -r qbraid-chat.zip qbraid-chat -x "*/node_modules/*" "*/dist/*" "*/out/*" "*/.git/*" "*.vsix"
   ```
3. Use the qBraid-CLI to upload your solution:
   ```bash
   qbraid files upload qbraid-chat.zip --namespace fullstack-challenge
   ```
4. To overwrite a previous upload:

   ```bash
   qbraid files upload qbraid-chat.zip --namespace fullstack-challenge --overwrite
   ```

   You can overwrite your initial upload 2 times, for a total of 3 uploads.

### Submission Verification
Upon upload, your submission will be verified using the following process:

```bash
unzip qbraid-chat.zip
cd qbraid-chat
find . -name "*.vsix" -type f -delete
npm install
npm run vsce:package
[[ -f "qbraid-chat-0.1.0.vsix" ]] && { echo "Upload success!"; } || { echo "Error: VSIX file not found."; exit 1; }
```

Any submission failing this process will not be reviewed.

## Evaluation Criteria
At the end of the upload window, your submission will be reviewed based on:

1. **Core Functionality**: Does the extension meet the requirements?
2. **UI/UX**: Is the interface user-friendly and well-designed?
3. **Code Quality**: Is the code clean, modular, and well-documented?

If selected for a second-round technical interview, be prepared to discuss your solution and the technical decisions you made.

## Support
- If you experience any issues uploading your solution, or if you run out of credits, please contact us at **contact@qbraid.com** with the subject line:
  **FULL-STACK CHALLENGE LOGISTICS - [Your Name]**

## Resources
- [VS Code Extension API Documentation](https://code.visualstudio.com/api)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)
