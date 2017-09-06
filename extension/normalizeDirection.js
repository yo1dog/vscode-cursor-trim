/**
 * Normalizes a direction param to either -1, 0, or 1.
 * @param {any} direction Direction param to normalize.
 * @returns The direction normalized to -1, 0, or 1.
 */
module.exports = function normalizeDirection(direction) {
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
};