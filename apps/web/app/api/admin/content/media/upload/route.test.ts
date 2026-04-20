jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/gcs-storage", () => ({
  createSignedUploadUrl: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { createSignedUploadUrl } from "@/lib/admin/gcs-storage";
import { POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedCreateSignedUploadUrl =
  createSignedUploadUrl as jest.MockedFunction<typeof createSignedUploadUrl>;

describe("POST /api/admin/content/media/upload", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedCreateSignedUploadUrl.mockReset();
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
    mockedCreateSignedUploadUrl.mockResolvedValue({
      signedUrl:
        "https://storage.googleapis.com/upload/pregnancy-content/weeks/02/123-cover.png?signature=abc",
    } as never);

    const response = await POST({
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
    } as Request);

    expect(mockedCreateSignedUploadUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        bucketId: "pregnancy-content",
        objectPath: expect.stringMatching(/^weeks\/02\/\d+-cover\.png$/),
        contentType: "image/png",
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        ok: true,
        bucketId: "pregnancy-content",
        objectPath: expect.stringMatching(/^weeks\/02\/\d+-cover\.png$/),
        signedUrl: expect.stringContaining(
          "https://storage.googleapis.com/upload/",
        ),
        token: null,
        contentType: "image/png",
      }),
    );
  });
});
