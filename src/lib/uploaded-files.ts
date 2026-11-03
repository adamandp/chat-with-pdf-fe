/** Demo PDF binaries are stored in IndexedDB; metadata lives in localStorage. */
const files = new Map<string, string>();
const databaseName = "chat-with-pdf-demo-files";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("pdfs");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function transaction<T>(
  id: string,
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const operation = work(db.transaction("pdfs", mode).objectStore("pdfs"));
      operation.onsuccess = () => resolve(operation.result);
      operation.onerror = () => reject(operation.error);
    });
  } finally {
    db.close();
  }
}

export function rememberUploadedFile(id: string, file: File) {
  const old = files.get(id);
  if (old) URL.revokeObjectURL(old);
  files.set(id, URL.createObjectURL(file));
  if (typeof indexedDB !== "undefined") {
    void transaction(id, "readwrite", (store) => store.put(file, id)).catch(() => {});
  }
}

export function getUploadedFileUrl(id: string) {
  return files.get(id);
}

export async function getRememberedUploadedFileUrl(id: string): Promise<string | undefined> {
  if (files.has(id)) return files.get(id);
  if (typeof indexedDB === "undefined") return undefined;
  const file = await transaction<Blob | undefined>(id, "readonly", (store) => store.get(id));
  if (!file) return undefined;
  const url = URL.createObjectURL(file);
  files.set(id, url);
  return url;
}

export async function forgetUploadedFile(id: string) {
  const url = files.get(id);
  if (url) URL.revokeObjectURL(url);
  files.delete(id);
  if (typeof indexedDB !== "undefined")
    await transaction(id, "readwrite", (store) => store.delete(id));
}
