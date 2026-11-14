import { Platform } from "react-native";

export interface PickedTextAsset {
  uri: string;
  file?: Blob;
}

const SESSION_STORAGE_PREFIX = "mcfy_pending_import:";
const pendingImports = new Map<string, string>();

/**
 * Reads plain text from a DocumentPicker asset across Web, iOS, and Android.
 */
export async function readTextFromAsset(asset: PickedTextAsset): Promise<string> {
  if (Platform.OS === "web") {
    if (asset.file && typeof asset.file.text === "function") {
      return await asset.file.text();
    }
    const response = await fetch(asset.uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch file (${response.status})`);
    }
    return await response.text();
  }

  const { File } = await import("expo-file-system");
  return await new File(asset.uri).text();
}

/**
 * Reads plain text from a URI across Web (blob:/http:) and Native (file://).
 */
export async function readTextFromUri(uri: string): Promise<string> {
  const cached = getPendingImportContent(uri);
  if (cached !== null) {
    return cached;
  }

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch file (${response.status})`);
    }
    return await response.text();
  }

  const { File } = await import("expo-file-system");
  return await new File(uri).text();
}

/**
 * Temporarily caches parsed import text across route navigation so web blob URLs
 * remain resilient and native avoids redundant disk reads.
 */
export function setPendingImportContent(uri: string, content: string): void {
  pendingImports.set(uri, content);
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${uri}`, content);
    } catch {
      // Ignore quota or private-mode sessionStorage errors
    }
  }
}

export function getPendingImportContent(uri: string): string | null {
  const mem = pendingImports.get(uri);
  if (mem !== undefined) {
    return mem;
  }
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      return window.sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${uri}`);
    } catch {
      return null;
    }
  }
  return null;
}

export function clearPendingImportContent(uri: string): void {
  pendingImports.delete(uri);
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${uri}`);
    } catch {
      // Ignore
    }
  }
}

