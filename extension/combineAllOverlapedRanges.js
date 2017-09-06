/**
 * Combines all ranges that overlap.
 * @param {vscode.Range[]} ranges List of ranges to combine if they overlap.
 * @returns List of ranges with all overlapping ranges combined.
 */
module.exports = function combineAllOverlapedRanges(ranges) {
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
};

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