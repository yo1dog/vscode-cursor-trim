const vscode = require('vscode');


/**
 * Gets the range of whitespace before the start of the given selection.
 * @param {vscode.Document}  document  Document the selection is on.
 * @param {vscode.Selection} selection Selection to use.
 * @returns Range of the preceeding whitespace.
 */
module.exports = function getSelectionLeadingWhitespaceRange(document, selection) {
  const line = selection.start.line;
  const lineStr = document.lineAt(line).text;
  
  const endChar = selection.start.character;
  let startChar = endChar;
  
  while (startChar > 0 && lineStr[startChar - 1] === ' ' || lineStr[startChar - 1] === '\t') {
    --startChar;
  }
  
  return new vscode.Range(line, startChar, line, endChar);
};