jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/supabase-storage", () => ({
  ensureStorageBucketWithOptions: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { ensureStorageBucketWithOptions } from "@/lib/admin/supabase-storage";
import { POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedEnsureStorageBucketWithOptions =
  ensureStorageBucketWithOptions as jest.MockedFunction<
    typeof ensureStorageBucketWithOptions
  >;

describe("POST /api/admin/content/media/upload", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedEnsureStorageBucketWithOptions.mockReset();
  });

  test("rejects requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("file", new File(["hi"], "cover.png", { type: "image/png" }));
    formData.set("weekNumber", "2");

    const response = await POST(
      new Request("http://localhost:3000/api/admin/content/media/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(401);
  });

  test("returns a signed upload URL for admin uploads", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    const createSignedUploadUrl = jest.fn().mockResolvedValue({
      data: {
        signedUrl:
          "https://example.supabase.co/storage/v1/object/upload/sign/pregnancy-content/weeks/02/123-cover.png?token=abc",
        path: "weeks/02/123-cover.png",
        token: "abc",
      },
      error: null,
    });
    mockedEnsureStorageBucketWithOptions.mockResolvedValue({
      storage: {
        from: jest.fn().mockReturnValue({
          createSignedUploadUrl,
        }),
      },
    } as never);

    const response = await POST(
      {
        formData: async () => {
          const formData = new FormData();
          formData.set(
            "file",
            new File(["cover"], "cover.png", { type: "image/png" }),
          );
          formData.set("bucketId", "pregnancy-content");
          formData.set("mediaScope", "week");
          formData.set("weekNumber", "2");
          return formData;
        },
      } as Request,
    );

    expect(mockedEnsureStorageBucketWithOptions).toHaveBeenCalledWith(
      "pregnancy-content",
      { isPublic: true },
    );
    expect(createSignedUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^weeks\/02\/\d+-cover\.png$/),
      { upsert: true },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        ok: true,
        bucketId: "pregnancy-content",
        objectPath: expect.stringMatching(/^weeks\/02\/\d+-cover\.png$/),
        signedUrl: expect.stringContaining("/storage/v1/object/upload/sign/"),
        token: "abc",
        contentType: "image/png",
      }),
    );
  });
});
