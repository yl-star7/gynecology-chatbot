import { Schift } from "@schift-io/sdk";

let _client: Schift | null = null;

export function getSchiftClient(): Schift | null {
  const apiKey = process.env.SCHIFT_API_KEY;
  if (!apiKey) return null;

  if (!_client) {
    _client = new Schift({ apiKey });
  }
  return _client;
}
