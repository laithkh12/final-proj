export function canSaveDuplicateTitle(originalTitle: string, currentTitle: string): boolean {
  const current = currentTitle.trim();
  return current.length > 0 && current !== originalTitle.trim();
}
