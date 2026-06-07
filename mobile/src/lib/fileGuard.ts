export const MAX_FILE_MB = 3;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

export function isFileTooLarge(byteSize: number): boolean {
  return byteSize > MAX_FILE_BYTES;
}
