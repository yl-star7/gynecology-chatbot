const TWILIO_VERIFY_BASE_URL = "https://verify.twilio.com/v2";

type TwilioVerifyConfig = {
  accountSid: string;
  authToken: string;
  serviceSid: string;
};

type TwilioVerificationResponse = {
  sid: string;
  status: string;
  to: string;
};

function getTwilioVerifyConfig(): TwilioVerifyConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    return null;
  }

  return {
    accountSid,
    authToken,
    serviceSid,
  };
}

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

function createTwilioHeaders(config: TwilioVerifyConfig) {
  const basicAuth = Buffer.from(
    `${config.accountSid}:${config.authToken}`,
  ).toString("base64");

  return {
    Authorization: `Basic ${basicAuth}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

async function parseTwilioResponse(response: Response) {
  const payload = (await response.json()) as {
    message?: string;
    status?: string;
    sid?: string;
    to?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message ?? "문자 인증 요청을 처리하지 못했습니다.");
  }

  return payload;
}

export async function sendSmsVerification(phoneNumber: string) {
  const to = normalizePhoneNumberToE164(phoneNumber);
  const config = getTwilioVerifyConfig();

  if (!config) {
    return {
      sid: "mock-verification",
      status: "pending",
      to,
    };
  }

  const response = await fetch(
    `${TWILIO_VERIFY_BASE_URL}/Services/${config.serviceSid}/Verifications`,
    {
      method: "POST",
      headers: createTwilioHeaders(config),
      body: new URLSearchParams({
        To: to,
        Channel: "sms",
        Locale: "ko",
      }).toString(),
      cache: "no-store",
    },
  );

  const payload = await parseTwilioResponse(response);
  return {
    sid: payload.sid ?? "",
    status: payload.status ?? "pending",
    to: payload.to ?? to,
  };
}

export async function checkSmsVerification(
  phoneNumber: string,
  verificationCode: string,
) {
  const to = normalizePhoneNumberToE164(phoneNumber);
  const code = verificationCode.trim();
  const config = getTwilioVerifyConfig();

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

  const response = await fetch(
    `${TWILIO_VERIFY_BASE_URL}/Services/${config.serviceSid}/VerificationCheck`,
    {
      method: "POST",
      headers: createTwilioHeaders(config),
      body: new URLSearchParams({
        To: to,
        Code: code,
      }).toString(),
      cache: "no-store",
    },
  );

  const payload = await parseTwilioResponse(response);

  if (payload.status !== "approved") {
    throw new Error("인증 코드를 확인해 주세요.");
  }

  return {
    sid: payload.sid ?? "",
    status: payload.status,
    to: payload.to ?? to,
  };
}
