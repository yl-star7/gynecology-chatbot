import { Schift } from "@schift-io/sdk";

async function main() {
  const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

  // Try SDK list APIs to enumerate bucket documents.
  // Schift SDK 0.8 has listBuckets + bucketGraph — file listing may not be direct.
  // Fall back to raw HTTP if needed.

  const bucketName = "pregnancy-knowledge";
  const buckets = await schift.listBuckets();
  const b: any = buckets.find((x: any) => x.name === bucketName);
  if (!b) {
    console.error("bucket not found");
    process.exit(1);
  }
  console.log("bucket id:", b.id, "files:", b.file_count);

  // Raw HTTP: try a few plausible endpoints
  const base = "https://api.schift.io";
  const apiKey = process.env.SCHIFT_API_KEY!;
  const auth = { Authorization: `Bearer ${apiKey}` } as Record<string, string>;

  const endpoints = [
    `${base}/v1/buckets/${b.id}/files`,
    `${base}/v1/buckets/${b.id}/documents`,
    `${base}/v1/buckets/${encodeURIComponent(bucketName)}/files`,
    `${base}/v1/files?bucket=${b.id}`,
    `${base}/v1/documents?bucket=${b.id}`,
  ];

  for (const url of endpoints) {
    try {
      const r = await fetch(url, { headers: auth });
      const body = r.ok ? await r.text() : `HTTP ${r.status}`;
      console.log(`\n[GET ${url}] → ${r.status}`);
      if (r.ok) {
        console.log(body.slice(0, 600));
        break;
      }
    } catch (e: any) {
      console.log(`  error: ${e.message}`);
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
