export const humanReadableSize = (size) => {
  if (typeof size !== 'number' || isNaN(size) || size < 0) {
    return 'Invalid size';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let readableSize = size;

  while (readableSize >= 1024 && unitIndex < units.length - 1) {
    readableSize /= 1024;
    unitIndex += 1;
  }

  return `${readableSize.toFixed(2)} ${units[unitIndex]}`;
};