import { Schift } from "@schift-io/sdk";

const API_KEY = process.env.SCHIFT_API_KEY ?? "sch_mtlv4f-gr0EdZ0WXFiqko-plt1YZHUfI3Yo3TKJDCxE";
const client = new Schift({ apiKey: API_KEY });

async function main() {
  console.log("=== Buckets ===");
  try {
    const buckets = await client.listBuckets();
    console.log(JSON.stringify(buckets, null, 2));
  } catch (e) {
    console.error("listBuckets:", e.message);
  }

  console.log("\n=== Collections ===");
  try {
    const collections = await client.listCollections();
    console.log(JSON.stringify(collections, null, 2));
  } catch (e) {
    console.error("listCollections:", e.message);
  }

  console.log("\n=== Usage ===");
  try {
    const usage = await client.usage();
    console.log(JSON.stringify(usage, null, 2));
  } catch (e) {
    console.error("usage:", e.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
