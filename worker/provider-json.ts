// Provider responses are small; enforce a limit before parsing to bound memory use.
export async function providerJson(
  response: Response,
): Promise<Record<string, unknown>> {
  if (!response.body) throw new Error("provider_empty_response");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 32768) {
        await reader.cancel();
        throw new Error("provider_response_too_large");
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    const result: unknown = JSON.parse(text + decoder.decode());
    if (!result || typeof result !== "object" || Array.isArray(result))
      throw new Error("provider_invalid_response");
    return result as Record<string, unknown>;
  } finally {
    reader.releaseLock();
  }
}
