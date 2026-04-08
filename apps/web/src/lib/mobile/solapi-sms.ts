import { createHash, createHmac, randomBytes, randomInt } from "crypto";

import { supabaseSelect } from "@/lib/supabase/admin-client";
import { computePhoneNumberBlindIndex } from "@/lib/privacy/phone-crypto";

const SOLAPI_BASE_URL = "https://api.solapi.com";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type SolapiConfig = {
  apiKey: string;
  apiSecret: string;
  senderNumber: string;
};

function getSolapiConfig(): SolapiConfig | null {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const senderNumber = process.env.SOLAPI_SENDER_NUMBER;
  if (!apiKey || !apiSecret || !senderNumber) return null;
  return { apiKey, apiSecret, senderNumber };
}

// ---------------------------------------------------------------------------
// Auth headers (HMAC-SHA256)
// ---------------------------------------------------------------------------

function createSolapiHeaders(config: SolapiConfig) {
  const date = new Date().toISOString();
  const salt = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", config.apiSecret)
    .update(date + salt)
    .digest("hex");

  return {
    Authorization: `HMAC-SHA256 apiKey=${config.apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Phone number helpers
// ---------------------------------------------------------------------------

/**
 * Normalize any Korean phone number variant to E.164 format (+82...).
 */
export function normalizePhoneNumberToE164(phoneNumber: string) {
  const normalized = phoneNumber.replace(/[^\d+]/g, "");

  if (normalized.startsWith("+82")) {
    return normalized;
  }

  if (normalized.startsWith("82")) {
    return `+${normalized}`;
  }

  if (normalized.startsWith("0")) {
    return `+82${normalized.slice(1)}`;
  }

  throw new Error("전화번호 형식을 확인해 주세요.");
}

/**
 * Convert E.164 (+82...) to Solapi domestic format (01012345678).
 */
function toSolapiPhoneNumber(e164: string): string {
  if (e164.startsWith("+82")) {
    return "0" + e164.slice(3);
  }
  return e164;
}

// ---------------------------------------------------------------------------
// OTP helpers
// ---------------------------------------------------------------------------

function generateOtpCode(): string {
  return randomInt(100000, 999999).toString();
}

function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

// ---------------------------------------------------------------------------
// Solapi HTTP helpers
// ---------------------------------------------------------------------------

type SolapiSendResponse = {
  groupId?: string;
  messageId?: string;
  statusCode?: string;
  to?: string;
};

async function parseSolapiResponse(response: Response) {
  const payload = (await response.json()) as {
    groupId?: string;
    messageId?: string;
    statusCode?: string;
    to?: string;
    errorMessage?: string;
  };

  if (!response.ok) {
    throw new Error(payload.errorMessage ?? "문자 발송에 실패했습니다.");
  }

  return payload;
}

async function sendViaSolapi(
  config: SolapiConfig,
  to: string,
  text: string,
): Promise<SolapiSendResponse> {
  const domesticTo = toSolapiPhoneNumber(to);

  const response = await fetch(`${SOLAPI_BASE_URL}/messages/v4/send`, {
    method: "POST",
    headers: createSolapiHeaders(config),
    body: JSON.stringify({
      message: {
        to: domesticTo,
        from: config.senderNumber,
        text,
      },
    }),
    cache: "no-store",
  });

  return parseSolapiResponse(response);
}

// ---------------------------------------------------------------------------
// Verification request DB row type (for checkSmsVerification lookup)
// ---------------------------------------------------------------------------

type PhoneVerificationRow = {
  id: string;
  verification_sid: string | null;
  status: string;
  expires_at: string;
  phone_number_blind_index: string;
};

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Send a 6-digit OTP code via SMS.
 *
 * Returns `{ sid, status, to }` where `sid` is the SHA-256 hash of the OTP
 * code. The calling code in auth.ts stores this hash as `verification_sid` in
 * the `phone_verification_requests` table so `checkSmsVerification` can later
 * verify the user-provided code against it.
 */
export async function sendSmsVerification(phoneNumber: string) {
  const to = normalizePhoneNumberToE164(phoneNumber);
  const config = getSolapiConfig();

  if (!config) {
    return {
      sid: "mock-verification",
      status: "pending",
      to,
    };
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const messageBody = `[너스싱크] 인증번호: ${code}\n3분 내에 입력해주세요.`;

  await sendViaSolapi(config, to, messageBody);

  return {
    sid: codeHash,
    status: "pending",
    to,
  };
}

/**
 * Verify a user-provided OTP code against the latest pending verification
 * request for the given phone number.
 *
 * Looks up the most recent pending `phone_verification_requests` row by blind
 * index, checks expiry, and compares SHA-256 hashes.
 */
export async function checkSmsVerification(
  phoneNumber: string,
  verificationCode: string,
) {
  const to = normalizePhoneNumberToE164(phoneNumber);
  const code = verificationCode.trim();
  const config = getSolapiConfig();

  if (!config) {
    if (code.length < 4) {
      throw new Error("인증 코드를 확인해 주세요.");
    }

    return {
      sid: "mock-check",
      status: "approved",
      to,
    };
  }

  const blindIndex = computePhoneNumberBlindIndex(to);
  const rows = await supabaseSelect<PhoneVerificationRow[]>(
    `phone_verification_requests?phone_number_blind_index=eq.${blindIndex}&status=eq.pending&order=created_at.desc&limit=1`,
  );

  const row = rows[0];
  if (!row || !row.verification_sid) {
    throw new Error("인증 코드를 확인해 주세요.");
  }

  if (new Date(row.expires_at) < new Date()) {
    throw new Error("인증 코드가 만료되었습니다. 다시 요청해 주세요.");
  }

  const providedHash = hashOtpCode(code);
  if (providedHash !== row.verification_sid) {
    throw new Error("인증 코드를 확인해 주세요.");
  }

  return {
    sid: row.verification_sid,
    status: "approved",
    to,
  };
}

/**
 * Send an arbitrary SMS message (not OTP-related).
 */
export async function sendSmsMessage(phoneNumber: string, body: string) {
  const to = normalizePhoneNumberToE164(phoneNumber);
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new Error("문자 내용을 비워둘 수 없습니다.");
  }

  const config = getSolapiConfig();

  if (!config) {
    return {
      sid: "mock-message",
      status: "queued",
      to,
      body: trimmedBody,
    };
  }

  const result = await sendViaSolapi(config, to, trimmedBody);

  return {
    sid: result.groupId ?? result.messageId ?? "",
    status: result.statusCode ?? "queued",
    to,
    body: trimmedBody,
  };
}
