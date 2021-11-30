const vscode = require('vscode');


/**
 * Removes whitespace around all the cursors in the active text editor.
 * @param {number} direction The direction to trim. -1 for left, 1 for right, 0 for both.
 */
function trimCursors(direction = 0) {
  direction = normalizeDirection(direction);
  
  // make sure we have an active text editor
  // NOTE: we use registerCommand instead of registerTextEditorCommand because we
  // need greater control over the TextEditorEdit
  const textEditor = vscode.window.activeTextEditor;
  if (!textEditor) {
    return;
  }
  
  // get the ranges to delete
  const deleteRanges = getDeleteRanges(textEditor.document, textEditor.selections, direction);
  
  // combine all overlapping ranges
  const finalDeleteRanges = combineAllOverlapedRanges(deleteRanges);
  if (finalDeleteRanges.length === 0) {
    return;
  }
  
  // NOTE: I'm really not sure how the undo system works. Especially regarding
  // selections.
  // 
  // For example, if you undo and redo a command, the text changes are undone and
  // redone correctly, but the selections are not. The selections do not change
  // when you redo the command. However, if you put a second edit at the end of
  // your command, this fixes the issue (even if the edit does not do anything).
  // 
  // Also, if we do 2 edits and either one or both of the edits create an
  // undo stop, then 2 undos are required to completely undo the command.
  // However, if neither edit creates an undo stop, then 1 undo is required to
  // completely undo the command.
  
  // start the edit
  textEditor.edit(textEditorEdit => {
    // delete all the ranges
    for (let i = 0; i < finalDeleteRanges.length; ++i) {
      textEditorEdit.delete(finalDeleteRanges[i]);
    }
  }, {undoStopBefore: false, undoStopAfter: false}) // don't create an undo after (before does not seem to matter)
  .then(() => {
    textEditor.edit(textEditorEdit => {
      // noop
    }, {undoStopBefore: false, undoStopAfter: false});  // don't create an undo stop before (after does not seem to matter)
  }, err => {
    throw err;
  });
}

/**
 * Get the ranges of text to delete.
 * @param {vscode.Document}    document 
 * @param {vscode.Selection[]} selections 
 * @param {number}             direction 
 * @return Ranges to delete.
 */
function getDeleteRanges(document, selections, direction) {
  // get the ranges to delete from the whitespace ranges around the cursors
  const deleteRanges = [];
  
  // for each selection...
  for (let i = 0; i < selections.length; ++i) {
    if (direction <= 0) {
      // delete whitespace before the cursor
      const range = getSelectionLeadingWhitespaceRange(document, selections[i]);
      if (!range.isEmpty) {
        deleteRanges.push(range);
      }
    }
    
    if (direction >= 0) {
      // delete whitespace after the cursor
      const range = getSelectionTrailingWhitespaceRange(document, selections[i]);
      if (!range.isEmpty) {
        deleteRanges.push(range);
      }
    }
  }
  
  return deleteRanges;
}


module.exports = {
  activate(context) {
    // NOTE: we use registerCommand instead of registerTextEditorCommand because we
    // need greater control over the TextEditorEdit
    context.subscriptions.push(vscode.commands.registerCommand('yo1dog.cursor-trim.trimCursor',  () => trimCursors( 0)));
    context.subscriptions.push(vscode.commands.registerCommand('yo1dog.cursor-trim.lTrimCursor', () => trimCursors(-1)));
    context.subscriptions.push(vscode.commands.registerCommand('yo1dog.cursor-trim.rTrimCursor', () => trimCursors( 1)));
  },
  
  deactivate() {
  },
  
  trimCursors
};





/**
 * Normalizes a direction param to either -1, 0, or 1.
 * @param {any} direction Direction param to normalize.
 * @returns The direction normalized to -1, 0, or 1.
 */
function normalizeDirection(direction) {
  if (typeof direction !== 'number') {
    return 0;
  }
  if (direction === 0) {
    return 0;
  }
  if (direction > 0) {
    return 1;
  }
  return -1;
}






/**
 * Gets the range of whitespace before the start of the given selection.
 * @param {vscode.Document}  document  Document the selection is on.
 * @param {vscode.Selection} selection Selection to use.
 * @returns Range of the preceeding whitespace.
 */
function getSelectionLeadingWhitespaceRange(document, selection) {
  const line = selection.start.line;
  const lineStr = document.lineAt(line).text;
  
  const endChar = selection.start.character;
  let startChar = endChar;
  
  while (startChar > 0 && lineStr[startChar - 1] === ' ' || lineStr[startChar - 1] === '\t') {
    --startChar;
  }
  
  return new vscode.Range(line, startChar, line, endChar);
}





/**
 * Gets the range of whitespace after the end of the given selection.
 * @param {vscode.Document}  document  Document the selection is on.
 * @param {vscode.Selection} selection Selection to use.
 * @returns Range of the proceeding whitespace.
 */
function getSelectionTrailingWhitespaceRange(document, selection) {
  const line = selection.end.line;
  const lineStr = document.lineAt(line).text;
  
  const startChar = selection.end.character;
  let endChar = startChar;
  
  while (endChar < lineStr.length && lineStr[endChar] === ' ' || lineStr[endChar] === '\t') {
    ++endChar;
  }
  
  return new vscode.Range(line, startChar, line, endChar);
}





/**
 * Combines all ranges that overlap.
 * @param {vscode.Range[]} ranges List of ranges to combine if they overlap.
 * @returns List of ranges with all overlapping ranges combined.
 */
function combineAllOverlapedRanges(ranges) {
  const finalRanges = ranges.slice(0);
  
  for (let i = 0; i < finalRanges.length; ++i) {
    for (let j = i + 1; j < finalRanges.length; ++j) {
      const overlapedRange = combineOverlapedRanges(finalRanges[i], finalRanges[j]);
      if (!overlapedRange) {
        continue;
      }
      
      finalRanges[i] = overlapedRange;
      finalRanges.splice(j , 1);
      --j;
    }
  }
  
  return finalRanges;
}

/**
 * Combines the given ranges if they overlap.
 * @param {vscode.Range} rangeA Frist range.
 * @param {vscode.Range} rangeB Second range.
 * @returns A range which is the union between the two ranges if they overlap or null.
 */
function combineOverlapedRanges(rangeA, rangeB) {
  if (!rangeA.intersection(rangeB)) {
    return null;
  }
  
  return rangeA.union(rangeB);
}