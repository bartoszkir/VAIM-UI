import config from "../config";
import { HttpError } from "./httpClient";

export function getApiBaseUrl(): string {
  return config.apiBaseUrl.endsWith("/")
    ? config.apiBaseUrl.slice(0, -1)
    : config.apiBaseUrl;
}

export function getDownloadFileName(
  contentDisposition: string | null,
  fallbackName: string,
): string {
  if (!contentDisposition) {
    return fallbackName;
  }

  const encodedFileNameMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i,
  );

  if (encodedFileNameMatch?.[1]) {
    try {
      return decodeURIComponent(encodedFileNameMatch[1]);
    } catch {
      return encodedFileNameMatch[1];
    }
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (fileNameMatch?.[1]) {
    return fileNameMatch[1];
  }

  return fallbackName;
}

export async function downloadFileFromResponse(
  response: Response,
  url: string,
  fallbackName: string,
): Promise<void> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new HttpError(
      response.status,
      response.statusText,
      url,
      errorText || undefined,
    );
  }

  const blob = await response.blob();
  const fileName = getDownloadFileName(
    response.headers.get("content-disposition"),
    fallbackName,
  );

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
