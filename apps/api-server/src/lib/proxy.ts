interface UpstreamRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

export async function proxyUpstream(
  url: string,
  options: UpstreamRequestOptions = {}
): Promise<unknown> {
  const urlWithParams = new URL(url);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      urlWithParams.searchParams.set(key, value);
    }
  }

  const response = await fetch(urlWithParams.toString(), {
    headers: {
      ...options.headers,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Upstream API error: ${response.status}`);
  }

  return response.json();
}
