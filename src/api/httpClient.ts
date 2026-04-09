import config from "../config";

export class HttpError extends Error {
  status: number;
  statusText: string;
  url: string;

  constructor(
    status: number,
    statusText: string,
    url: string,
    message?: string,
  ) {
    super(message ?? `Request failed with status ${status}`);
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.name = "HttpError";
  }
}

export type HttpRequestOptions = RequestInit;
export type HttpQueryParam = string | number | boolean | null | undefined;

export type HttpQueryParams = Record<string, HttpQueryParam | HttpQueryParam[]>;

export type HttpRequestConfig = Omit<RequestInit, "method"> & {
  query?: HttpQueryParams;
  expectedContentType?: string;
};

class HttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }

  private toAbsoluteUrl(path: string, query?: HttpQueryParams): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value == null) {
          continue;
        }

        const values = Array.isArray(value) ? value : [value];
        for (const item of values) {
          if (item == null) {
            continue;
          }

          url.searchParams.append(key, String(item));
        }
      }
    }

    return url.toString();
  }

  private async parseResponseBody(
    response: Response,
    expectedContentType?: string,
  ): Promise<unknown> {
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (expectedContentType && !contentType.includes(expectedContentType)) {
      throw new HttpError(
        502,
        "Bad Gateway",
        response.url,
        "Unexpected content type",
      );
    }

    if (!contentType.includes("application/json")) {
      return response.text();
    }

    return response.json();
  }

  private withJsonBody(
    body: unknown,
    options: HttpRequestConfig = {},
  ): HttpRequestOptions {
    const headers = new Headers(options.headers);

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return {
      ...options,
      headers,
      body: JSON.stringify(body),
    };
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options: HttpRequestConfig = {},
  ): Promise<T> {
    const { query, expectedContentType, ...requestOptions } = options;
    const url = this.toAbsoluteUrl(path, query);
    const response = await fetch(url, {
      ...requestOptions,
      credentials: "include",
      method,
    });
    const body = await this.parseResponseBody(response, expectedContentType);

    if (!response.ok) {
      const message =
        typeof body === "string" && body.length > 0
          ? body
          : `Request failed with status ${response.status}`;
      throw new HttpError(response.status, response.statusText, url, message);
    }

    return body as T;
  }

  get<T>(path: string, options: HttpRequestConfig = {}) {
    return this.request<T>("GET", path, options);
  }

  post<T>(path: string, body?: unknown, options: HttpRequestConfig = {}) {
    return this.request<T>("POST", path, this.withJsonBody(body, options));
  }

  put<T>(path: string, body?: unknown, options: HttpRequestConfig = {}) {
    return this.request<T>("PUT", path, this.withJsonBody(body, options));
  }

  patch<T>(path: string, body?: unknown, options: HttpRequestConfig = {}) {
    return this.request<T>("PATCH", path, this.withJsonBody(body, options));
  }

  delete<T>(path: string, options: HttpRequestConfig = {}) {
    return this.request<T>("DELETE", path, options);
  }
}

export const httpClient = new HttpClient(config.apiBaseUrl);
