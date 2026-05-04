import { Hono } from "hono";
import {
  completePhoneSignIn,
  getAuthenticatedUser,
  startPhoneVerification,
} from "@gynecology-chatbot/mobile-api/auth";
import { checkRateLimit } from "@gynecology-chatbot/mobile-api/rate-limit";
import { requireMobileSession } from "../../lib/session-auth.js";

const app = new Hono();

function getClientIp(c: import("hono").Context) {
  return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// GET /api/mobile/auth/session
app.get("/session", async (c) => {
  try {
    const { userId } = await requireMobileSession(c, null, {
      requireApproved: false,
    });
    const user = await getAuthenticatedUser(userId);

    if (!user) {
      return c.json({ error: "user not found" }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error("mobile auth session route error", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "failed to restore session",
      },
      401,
    );
  }
});

// POST /api/mobile/auth/login
app.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const verificationCode =
      typeof body.verificationCode === "string"
        ? body.verificationCode.trim()
        : "";

    if (!phoneNumber || !verificationCode) {
      return c.json(
        { error: "phoneNumber and verificationCode are required" },
        400,
      );
    }

    const ipRateCheck = checkRateLimit(
      `mobile-auth-login:${getClientIp(c)}:${phoneNumber}`,
      10,
      60_000,
    );
    const phoneRateCheck = checkRateLimit(
      `mobile-auth-login-phone:${phoneNumber}`,
      10,
      300_000,
    );
    const rateCheck = !ipRateCheck.allowed
      ? ipRateCheck
      : !phoneRateCheck.allowed
        ? phoneRateCheck
        : null;
    if (rateCheck) {
      c.header(
        "Retry-After",
        String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
      );
      return c.json(
        { error: "요청이 잠시 많아요. 조금 뒤에 다시 시도해주세요." },
        429,
      );
    }

    const result = await completePhoneSignIn(phoneNumber, verificationCode);
    return c.json(result);
  } catch (error) {
    console.error("mobile auth login route error", error);
    return c.json(
      { error: "로그인을 진행하지 못했어요. 입력한 정보를 다시 확인해주세요." },
      400,
    );
  }
});

// POST /api/mobile/auth/start-phone-verification
app.post("/start-phone-verification", async (c) => {
  try {
    const body = await c.req.json();
    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";

    if (!phoneNumber) {
      return c.json({ error: "phoneNumber is required" }, 400);
    }

    const ipRateCheck = checkRateLimit(
      `mobile-auth-start:${getClientIp(c)}:${phoneNumber}`,
      5,
      60_000,
    );
    const phoneRateCheck = checkRateLimit(
      `mobile-auth-start-phone:${phoneNumber}`,
      10,
      300_000,
    );
    const rateCheck = !ipRateCheck.allowed
      ? ipRateCheck
      : !phoneRateCheck.allowed
        ? phoneRateCheck
        : null;
    if (rateCheck) {
      c.header(
        "Retry-After",
        String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
      );
      return c.json(
        { error: "요청이 잠시 많아요. 조금 뒤에 다시 시도해주세요." },
        429,
      );
    }

    const result = await startPhoneVerification(phoneNumber);
    return c.json(result);
  } catch (error) {
    console.error("mobile start phone verification route error", error);

    const isSmsConfigError =
      error instanceof Error &&
      error.message.includes("문자 발송 설정이 비어 있어요");

    return c.json(
      {
        error: isSmsConfigError
          ? "지금은 인증번호를 보낼 수 없어요. 잠시 후 다시 시도해 주세요."
          : "인증 요청을 진행하지 못했어요. 입력한 정보를 다시 확인해주세요.",
      },
      isSmsConfigError ? 503 : 400,
    );
  }
});

export default app;
