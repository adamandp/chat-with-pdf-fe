/** Session-only object URLs for the mock uploader. A reload requires re-upload. */
const files = new Map<string, string>();

export function rememberUploadedFile(id: string, file: File) {
  const old = files.get(id);
  if (old) URL.revokeObjectURL(old);
  files.set(id, URL.createObjectURL(file));
}
export function getUploadedFileUrl(id: string) { return files.get(id); }
