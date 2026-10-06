/** Keep framework/proxy HTML errors out of JSON parsing and the UI. */
export async function readApiResponse<T>(response: Response): Promise<T> {
  const fallback =
    response.status === 404
      ? "API endpoint not found (404). Please restart the Portal development server and try again."
      : `Unexpected server response (HTTP ${response.status}). Please try again later or check the server logs.`;
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error(fallback);
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(fallback);
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error(fallback);
  if (!response.ok) {
    const error = "error" in data ? data.error : undefined;
    throw new Error(typeof error === "string" ? error : fallback);
  }
  return data as T;
}
