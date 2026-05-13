jest.mock("@/lib/admin/gcs-storage", () => ({
  createSignedReadUrl: jest.fn(),
}));

jest.mock("@gynecology-chatbot/db/prisma", () => ({
  prisma: {
    system_config: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "@gynecology-chatbot/db/prisma";
import { createSignedReadUrl } from "@/lib/admin/gcs-storage";
import { GET } from "./route";

const mockedSystemConfig = prisma.system_config as unknown as {
  findUnique: jest.Mock;
};
const mockedCreateSignedReadUrl =
  createSignedReadUrl as jest.MockedFunction<typeof createSignedReadUrl>;

describe("GET /api/mobile/branding", () => {
  beforeEach(() => {
    mockedSystemConfig.findUnique.mockReset();
    mockedCreateSignedReadUrl.mockReset();
    mockedCreateSignedReadUrl.mockResolvedValue({
      signedUrl: "https://signed.example.test/neutral.png",
    });
  });

  it("returns only visible external surveys for the app", async () => {
    mockedSystemConfig.findUnique
      .mockResolvedValueOnce({
        value: {
          mascotBucketId: null,
          mascotObjectPath: null,
          mascotSourceFileName: null,
          mascotAltText: "펭귄 간호사",
          surveyFormUrl: "https://forms.gle/legacy",
          externalSurveys: [
            {
              id: "survey-1",
              label: "1차 설문지",
              url: "https://forms.gle/ZoLxWPdwid1F94FE8",
              visible: true,
            },
            {
              id: "survey-2",
              label: "2차 설문지",
              url: "https://forms.gle/LvFmEZHkGM3MMLQ8A",
              visible: false,
            },
            {
              id: "survey-3",
              label: "3차 설문지",
              url: "https://forms.gle/fNUX6qDjXR5wXoGt7",
              visible: true,
            },
          ],
        },
      })
      .mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        surveyFormUrl: "https://forms.gle/ZoLxWPdwid1F94FE8",
        externalSurveys: [
          {
            id: "survey-1",
            label: "1차 설문지",
            url: "https://forms.gle/ZoLxWPdwid1F94FE8",
            visible: true,
          },
          {
            id: "survey-3",
            label: "3차 설문지",
            url: "https://forms.gle/fNUX6qDjXR5wXoGt7",
            visible: true,
          },
        ],
      }),
    );
  });

  it("does not fall back to the legacy survey form url", async () => {
    mockedSystemConfig.findUnique
      .mockResolvedValueOnce({
        value: {
          mascotBucketId: null,
          mascotObjectPath: null,
          mascotSourceFileName: null,
          mascotAltText: "펭귄 간호사",
          surveyFormUrl: "https://forms.gle/legacy",
        },
      })
      .mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        surveyFormUrl: null,
        externalSurveys: [],
      }),
    );
  });

  it("returns the default mascot when no custom mascot is configured", async () => {
    mockedSystemConfig.findUnique
      .mockResolvedValueOnce({
        value: {
          mascotBucketId: null,
          mascotObjectPath: null,
          mascotSourceFileName: null,
          mascotAltText: null,
          surveyFormUrl: null,
        },
      })
      .mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mockedCreateSignedReadUrl).toHaveBeenCalledWith({
      bucketId: "pregnancy-content",
      objectPath: "assets/penguin-nurse/app/neutral.png",
      expiresMs: 60 * 60 * 24 * 7 * 1000,
    });
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        mascotImageUrl: "https://signed.example.test/neutral.png",
        mascotAltText: "펭귄 간호사",
      }),
    );
  });

  it("falls back to the public default mascot url when signing fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockedCreateSignedReadUrl.mockRejectedValueOnce(new Error("sign failed"));
    mockedSystemConfig.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        mascotImageUrl:
          "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/neutral.png",
        mascotAltText: "펭귄 간호사",
      }),
    );
    warnSpy.mockRestore();
  });
});
