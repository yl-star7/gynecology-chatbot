jest.mock("@gynecology-chatbot/db/prisma", () => ({
  prisma: {
    workflow_definitions: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from "@gynecology-chatbot/db/prisma";

import {
  recordAdminWorkflowYamlSave,
  resolveAdminWorkflowYamlLocation,
} from "./workflow-yaml-location";

const mockedPrisma = prisma as unknown as {
  workflow_definitions: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

describe("workflow-yaml-location", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves the admin YAML location from the exact DB row slug", async () => {
    mockedPrisma.workflow_definitions.findFirst.mockResolvedValue({
      id: "wf-row-1",
      config: {
        workflowKind: "monolith",
        storagePath: "gs://agaya-workflow-config/runtime/current.yaml",
      },
      metadata: {},
    });

    await expect(resolveAdminWorkflowYamlLocation("monolith")).resolves.toEqual({
      routeName: "monolith",
      slug: "maternal-nursing-monolith",
      bucket: "agaya-workflow-config",
      objectPath: "runtime/current.yaml",
      storagePath: "gs://agaya-workflow-config/runtime/current.yaml",
      rowId: "wf-row-1",
    });
    expect(mockedPrisma.workflow_definitions.findFirst).toHaveBeenCalledWith({
      where: {
        provider: "gcs-yaml",
        slug: "maternal-nursing-monolith",
      },
      select: {
        id: true,
        config: true,
        metadata: true,
      },
    });
  });

  it("does not infer a location from catalog object names when the DB row is missing", async () => {
    mockedPrisma.workflow_definitions.findFirst.mockResolvedValue(null);

    await expect(
      resolveAdminWorkflowYamlLocation("monolith"),
    ).resolves.toBeNull();
  });

  it("records YAML saves on the same workflow_definitions row", async () => {
    mockedPrisma.workflow_definitions.findUnique.mockResolvedValue({
      config: {
        workflowKind: "monolith",
        storagePath: "gs://old/location.yaml",
      },
      metadata: {
        trigger: "mobile chat runtime",
      },
    });

    await recordAdminWorkflowYamlSave(
      {
        routeName: "monolith",
        slug: "maternal-nursing-monolith",
        bucket: "agaya-workflow-config",
        objectPath: "runtime/current.yaml",
        storagePath: "gs://agaya-workflow-config/runtime/current.yaml",
        rowId: "wf-row-1",
      },
      "name: runtime\nblocks: []\nedges: []\n",
    );

    const updateArg = mockedPrisma.workflow_definitions.update.mock.calls[0][0];
    expect(updateArg.where).toEqual({ id: "wf-row-1" });
    expect(updateArg.data.config).toMatchObject({
      workflowKind: "monolith",
      yamlSource: "gcs",
      storagePath: "gs://agaya-workflow-config/runtime/current.yaml",
      gcsBucket: "agaya-workflow-config",
      gcsObject: "runtime/current.yaml",
    });
    expect(updateArg.data.metadata).toEqual(
      expect.objectContaining({
        trigger: "mobile chat runtime",
        yamlSha: expect.any(String),
        version: expect.any(String),
        yamlUpdatedAt: expect.any(String),
      }),
    );
    expect(updateArg.data.updated_at).toBeInstanceOf(Date);
  });
});
