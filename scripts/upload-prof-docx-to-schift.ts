/**
 * 이예림 교수님 1st/2nd URL docx → Schift pregnancy-knowledge 컬렉션 업로드
 *
 * Usage:
 *   export $(grep -v '^#' .env | grep SCHIFT_API_KEY | xargs)
 *   pnpm tsx scripts/upload-prof-docx-to-schift.ts /tmp/prof-zip/이예림\ 교수님\ 1st,\ 2ndUrl
 */

import { Schift } from "@schift-io/sdk";
import fs from "fs";
import path from "path";

const COLLECTION = "pregnancy-knowledge";
const MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error(
      "Usage: pnpm tsx scripts/upload-prof-docx-to-schift.ts <dir>",
    );
    process.exit(1);
  }

  const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".docx"))
    .sort((a, b) => {
      const weekA = parseInt(a) || 999;
      const weekB = parseInt(b) || 999;
      return weekA - weekB;
    });

  console.log(`Found ${files.length} docx files in ${dir}`);
  console.log(`Uploading to Schift collection: ${COLLECTION}\n`);

  let uploaded = 0;
  let failed = 0;

  for (const filename of files) {
    const filePath = path.join(dir, filename);
    const buf = fs.readFileSync(filePath);
    const file = new File([new Blob([buf], { type: MIME })], filename, {
      type: MIME,
    });

    // 파일명 앞부분 숫자를 주차로 해석 (예: "18주차.docx" → week=18).
    const weekMatch = /^(\d{1,2})/.exec(filename);
    const metadata: Record<string, string> = {
      surface: "rag",
      lang: "ko",
    };
    if (weekMatch) {
      metadata.week = weekMatch[1];
    }

    try {
      const result = await schift.db.upload(COLLECTION, {
        files: [file],
        metadata,
      });
      uploaded++;
      console.log(
        `  ✓ ${filename} (${(buf.length / 1024).toFixed(1)}KB) tags=${JSON.stringify(metadata)}`,
      );
      // Rate limit 방지: 파일 간 3초 대기
      await new Promise((r) => setTimeout(r, 3000));
    } catch (e: any) {
      if (e.status === 429) {
        console.log(`  ⏳ ${filename}: rate limited, waiting 30s...`);
        await new Promise((r) => setTimeout(r, 30000));
        // 재시도
        try {
          const retry = await schift.db.upload(COLLECTION, {
            files: [file],
            metadata,
          });
          uploaded++;
          console.log(`  ✓ ${filename} (retry OK)`);
        } catch (e2: any) {
          failed++;
          console.error(`  ✗ ${filename}: ${e2.message}`);
        }
      } else {
        failed++;
        console.error(`  ✗ ${filename}: ${e.message}`);
      }
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
