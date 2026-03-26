const TWILIO_VERIFY_BASE_URL = "https://verify.twilio.com/v2";
const TWILIO_MESSAGES_BASE_URL = "https://api.twilio.com/2010-04-01";

type TwilioVerifyConfig = {
  accountSid: string;
  authToken: string;
  serviceSid: string;
};

type TwilioAuthConfig = {
  accountSid: string;
  authToken: string;
};

type TwilioSmsConfig = {
  accountSid: string;
  authToken: string;
  messagingServiceSid?: string;
  fromNumber?: string;
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

function getTwilioSmsConfig(): TwilioSmsConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const fromNumber = process.env.TWILIO_SMS_FROM;

  if (!accountSid || !authToken) {
    return null;
  }

  if (!messagingServiceSid && !fromNumber) {
    return null;
  }

  return {
    accountSid,
    authToken,
    messagingServiceSid,
    fromNumber,
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

function createTwilioHeaders(config: TwilioAuthConfig) {
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

export async function sendSmsMessage(phoneNumber: string, body: string) {
  const to = normalizePhoneNumberToE164(phoneNumber);
  const trimmedBody = body.trim();
  const config = getTwilioSmsConfig();

  if (!trimmedBody) {
    throw new Error("문자 내용을 비워둘 수 없습니다.");
  }

  if (!config) {
    return {
      sid: "mock-message",
      status: "queued",
      to,
      body: trimmedBody,
    };
  }

  const payload = new URLSearchParams({
    To: to,
    Body: trimmedBody,
  });

  if (config.messagingServiceSid) {
    payload.set("MessagingServiceSid", config.messagingServiceSid);
  } else if (config.fromNumber) {
    payload.set("From", config.fromNumber);
  }

  const response = await fetch(
    `${TWILIO_MESSAGES_BASE_URL}/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: createTwilioHeaders(config),
      body: payload.toString(),
      cache: "no-store",
    },
  );

  const twilioPayload = await parseTwilioResponse(response);
  return {
    sid: twilioPayload.sid ?? "",
    status: twilioPayload.status ?? "queued",
    to: twilioPayload.to ?? to,
    body: trimmedBody,
  };
}
