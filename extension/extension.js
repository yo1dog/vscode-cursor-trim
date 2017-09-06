const vscode                              = require('vscode');
const normalizeDirection                  = require('./normalizeDirection');
const getSelectionLeadingWhitespaceRange  = require('./getSelectionLeadingWhitespaceRange');
const getSelectionTrailingWhitespaceRange = require('./getSelectionTrailingWhitespaceRange');
const combineAllOverlapedRanges           = require('./combineAllOverlapedRanges');


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