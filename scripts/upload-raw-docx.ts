import { Schift } from "@schift-io/sdk";
import fs from "fs";

async function main() {
  const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });
  const bucket = process.env.BUCKET ?? "pregnancy-knowledge";
  const buf = fs.readFileSync(
    "/Users/jskang/Downloads/임신 주수 별 발달정보(0320_room).docx",
  );
  const rawFile = new File(
    [
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ],
    "임신_주수별_발달정보.docx",
    {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  );
  console.log(`Uploading raw docx to ${bucket} (surface=archive)...`);
  const result = await schift.db.upload(bucket, {
    files: [rawFile],
    metadata: { surface: "archive", lang: "ko" },
  });
  console.log("Done:", JSON.stringify(result));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
