import { resolveMobileUserId } from "./web-mobile-api";

describe("resolveMobileUserId", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  afterAll(() => {
    window.history.replaceState({}, "", "/");
  });

  it("returns null on the client when no explicit userId or query param is present", () => {
    expect(resolveMobileUserId()).toBeNull();
  });

  it("prefers the explicit userId when provided", () => {
    expect(resolveMobileUserId("user-1")).toBe("user-1");
  });

  it("reads userId from the query string on the client", () => {
    window.history.replaceState(
      {},
      "",
      "/?userId=user-2",
    );

    expect(resolveMobileUserId()).toBe("user-2");
  });
});
