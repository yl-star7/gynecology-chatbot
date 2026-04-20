import {
  computePhoneNumberBlindIndex,
  createPhoneNumberStorage,
  decryptPhoneNumber,
  redactPhoneNumber,
} from "./phone-crypto";

describe("phone-crypto", () => {
  const originalSecret = process.env.PHONE_DATA_SECRET;

  beforeEach(() => {
    process.env.PHONE_DATA_SECRET = "test-phone-data-secret";
  });

  afterAll(() => {
    process.env.PHONE_DATA_SECRET = originalSecret;
  });

  test("round-trips encrypted phone numbers and exposes derived fields", () => {
    const storage = createPhoneNumberStorage("+821012345678");

    expect(storage.phoneNumberEncrypted).not.toContain("+821012345678");
    expect(storage.phoneNumberLast4).toBe("5678");
    expect(storage.phoneNumberBlindIndex).toHaveLength(64);
    expect(decryptPhoneNumber(storage.phoneNumberEncrypted)).toBe(
      "+821012345678",
    );
  });

  test("blind index is deterministic for the same number", () => {
    expect(computePhoneNumberBlindIndex("+821055566677")).toBe(
      computePhoneNumberBlindIndex("+821055566677"),
    );
  });

  test("redacts phone numbers for audit output", () => {
    expect(redactPhoneNumber("+821012345678")).toBe("821-****-5678");
  });
});
