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
import { GET } from "./route";

const mockedSystemConfig = prisma.system_config as unknown as {
  findUnique: jest.Mock;
};

describe("GET /api/mobile/branding", () => {
  beforeEach(() => {
    mockedSystemConfig.findUnique.mockReset();
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
});
