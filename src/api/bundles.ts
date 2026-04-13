import config from "../config";
import { HttpError, httpClient } from "./httpClient";
import type {
  BundleCreateRequest,
  BundleDownloadByArtifactIdsRequest,
  BundleDto,
  BundleDtoPagedResult,
  BundleGenerateRequest,
  BundlePagedParams,
  BundleUpdateRequest,
} from "./types";

function getApiBaseUrl(): string {
  return config.apiBaseUrl.endsWith("/")
    ? config.apiBaseUrl.slice(0, -1)
    : config.apiBaseUrl;
}

function getDownloadFileName(
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

async function downloadBundleFromResponse(
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

export async function getPagedBundles(
  params: BundlePagedParams = {},
): Promise<BundleDtoPagedResult> {
  return httpClient.get<BundleDtoPagedResult>("/bundles/paging", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      toolType: params.toolType,
      tagIds: params.tagIds,
    },
  });
}

export async function getBundleById(id: string): Promise<BundleDto> {
  return httpClient.get<BundleDto>(`/bundles/${id}`);
}

export async function generateDynamicBundle(
  request: BundleGenerateRequest,
): Promise<BundleDto> {
  return httpClient.post<BundleDto>("/bundles/generate", request);
}

export async function updateBundle(
  id: string,
  request: BundleUpdateRequest,
): Promise<BundleDto> {
  return httpClient.put<BundleDto>(`/bundles/${id}`, request);
}

export async function createBundle(
  request: BundleCreateRequest,
): Promise<BundleDto> {
  return httpClient.post<BundleDto>("/bundles/create", request);
}

export async function downloadBundleZip(bundleId: string): Promise<void> {
  const url = `${getApiBaseUrl()}/bundles/${bundleId}/download`;
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  return downloadBundleFromResponse(response, url, `bundle-${bundleId}.zip`);
}

export async function downloadBundleZipByArtifactIds(
  request: BundleDownloadByArtifactIdsRequest,
): Promise<void> {
  const url = `${getApiBaseUrl()}/bundles/download`;
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  return downloadBundleFromResponse(response, url, "bundle-download.zip");
}
