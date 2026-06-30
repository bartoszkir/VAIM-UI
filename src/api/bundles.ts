import { downloadFileFromResponse, getApiBaseUrl } from "./download";
import { httpClient } from "./httpClient";
import type {
  BundleCreateRequest,
  BundleDownloadByArtifactIdsRequest,
  BundleDto,
  BundleDtoPagedResult,
  BundleGenerateRequest,
  BundlePagedParams,
  BundleUpdateRequest,
} from "./types";

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

  return downloadFileFromResponse(response, url, `bundle-${bundleId}.zip`);
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

  return downloadFileFromResponse(response, url, "bundle-download.zip");
}
