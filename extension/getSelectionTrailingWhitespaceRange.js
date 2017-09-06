const vscode = require('vscode');


/**
 * Gets the range of whitespace after the end of the given selection.
 * @param {vscode.Document}  document  Document the selection is on.
 * @param {vscode.Selection} selection Selection to use.
 * @returns Range of the proceeding whitespace.
 */
module.exports = function getSelectionTrailingWhitespaceRange(document, selection) {
  const line = selection.end.line;
  const lineStr = document.lineAt(line).text;
  
  const startChar = selection.end.character;
  let endChar = startChar;
  
  while (endChar < lineStr.length && lineStr[endChar] === ' ' || lineStr[endChar] === '\t') {
    ++endChar;
  }
  
  return new vscode.Range(line, startChar, line, endChar);
};