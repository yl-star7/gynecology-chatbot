import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "crypto";

const PHONE_CRYPTO_VERSION = "v1";
const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getPhoneDataSecret() {
  const secret = process.env.PHONE_DATA_SECRET;
  if (!secret) {
    throw new Error("PHONE_DATA_SECRET is required");
  }

  return secret;
}

function deriveKey(purpose: "enc" | "idx") {
  return createHash("sha256")
    .update(`${getPhoneDataSecret()}:${purpose}`)
    .digest();
}

export function getPhoneLast4(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  return digits.slice(-4).padStart(4, "0");
}

export function encryptPhoneNumber(phoneNumber: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(AES_ALGORITHM, deriveKey("enc"), iv);
  const encrypted = Buffer.concat([
    cipher.update(phoneNumber, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    PHONE_CRYPTO_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptPhoneNumber(payload: string) {
  const [version, ivValue, authTagValue, ciphertextValue] = payload.split(".");
  if (
    version !== PHONE_CRYPTO_VERSION ||
    !ivValue ||
    !authTagValue ||
    !ciphertextValue
  ) {
    throw new Error("Invalid encrypted phone payload");
  }

  const decipher = createDecipheriv(
    AES_ALGORITHM,
    deriveKey("enc"),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function computePhoneNumberBlindIndex(phoneNumber: string) {
  return createHmac("sha256", deriveKey("idx"))
    .update(phoneNumber)
    .digest("hex");
}

export function createPhoneNumberStorage(phoneNumber: string) {
  return {
    phoneNumberEncrypted: encryptPhoneNumber(phoneNumber),
    phoneNumberBlindIndex: computePhoneNumberBlindIndex(phoneNumber),
    phoneNumberLast4: getPhoneLast4(phoneNumber),
  };
}

export function redactPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length < 7) {
    return `***${digits.slice(-4)}`;
  }

  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}
