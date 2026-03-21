import { Pool } from "pg";
import { createPhoneNumberStorage } from "../src/lib/privacy/phone-crypto";

type PhoneRow = {
  id: string;
  phone_number: string | null;
  phone_number_encrypted: string | null;
  phone_number_blind_index: string | null;
  phone_number_last4: string | null;
};

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return databaseUrl;
}

async function backfillTable(pool: Pool, tableName: string) {
  const { rows } = await pool.query<PhoneRow>(
    `
      SELECT
        id,
        phone_number,
        phone_number_encrypted,
        phone_number_blind_index,
        phone_number_last4
      FROM public.${tableName}
      WHERE phone_number IS NOT NULL
        AND (
          phone_number_encrypted IS NULL
          OR phone_number_blind_index IS NULL
          OR phone_number_last4 IS NULL
        )
    `,
  );

  let updatedCount = 0;

  for (const row of rows) {
    if (!row.phone_number) {
      continue;
    }

    const storage = createPhoneNumberStorage(row.phone_number);
    await pool.query(
      `
        UPDATE public.${tableName}
        SET
          phone_number_encrypted = $2,
          phone_number_blind_index = $3,
          phone_number_last4 = $4
        WHERE id = $1
      `,
      [
        row.id,
        storage.phoneNumberEncrypted,
        storage.phoneNumberBlindIndex,
        storage.phoneNumberLast4,
      ],
    );
    updatedCount += 1;
  }

  return updatedCount;
}

async function main() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const usersUpdated = await backfillTable(pool, "users");
    const allowedPhoneNumbersUpdated = await backfillTable(
      pool,
      "allowed_phone_numbers",
    );
    const verificationRequestsUpdated = await backfillTable(
      pool,
      "phone_verification_requests",
    );

    console.log(
      JSON.stringify(
        {
          usersUpdated,
          allowedPhoneNumbersUpdated,
          verificationRequestsUpdated,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

void main();
