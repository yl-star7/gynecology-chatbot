jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/workflow-yaml-location", () => ({
  WORKFLOW_STAGE_MAPPING_BY_NAME: {
    monolith: { mappingKey: null },
    router: { mappingKey: "router" },
    "letter-reflection": { mappingKey: "letter_reflection" },
  },
  recordAdminWorkflowYamlSave: jest.fn(),
  resolveAdminWorkflowYamlLocation: jest.fn(),
}));

jest.mock("@/lib/mobile/workflows/load-workflow-yaml", () => ({
  refreshWorkflowFromStorage: jest.fn(),
}));

jest.mock("@/lib/mobile/schift-client", () => ({
  getSchiftClient: jest.fn(),
}));

jest.mock("@gynecology-chatbot/db/prisma", () => ({
  prisma: {
    system_config: {
      findUnique: jest.fn(),
    },
  },
}));

const mockDownload = jest.fn();
const mockSave = jest.fn();

jest.mock("@google-cloud/storage", () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        download: mockDownload,
        save: mockSave,
      })),
    })),
  })),
}));

import { parse as parseYaml } from "yaml";

import { readAdminSessionUser } from "@/lib/admin/auth";
import {
  recordAdminWorkflowYamlSave,
  resolveAdminWorkflowYamlLocation,
} from "@/lib/admin/workflow-yaml-location";
import { refreshWorkflowFromStorage } from "@/lib/mobile/workflows/load-workflow-yaml";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { GET, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedResolveAdminWorkflowYamlLocation =
  resolveAdminWorkflowYamlLocation as jest.MockedFunction<
    typeof resolveAdminWorkflowYamlLocation
  >;
const mockedGetSchiftClient = getSchiftClient as jest.MockedFunction<
  typeof getSchiftClient
>;

const workflowYaml = `version: 2
name: 테스트 워크플로우
description: 테스트 설명
admin_metadata:
  trigger: stage=2
config:
  calendar_summary_webhook_url: "$env.CALENDAR_SUMMARY_WEBHOOK_URL"
chat_flow:
  stages:
    question_answer:
      reflection_loop:
        min_user_turns_before_next: 2
        max_user_turns_per_question: 5
prompts:
  system: "시스템 프롬프트"
static_responses:
  off_topic:
    answer: "범위 밖이에요."
blocks:
  - id: start
    type: start
    title: 시작
edges: []
`;

describe("/api/admin/workflow-rules/yaml-workflows/[name]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    mockedResolveAdminWorkflowYamlLocation.mockResolvedValue({
      routeName: "monolith",
      slug: "maternal-nursing-monolith",
      bucket: "workflow-bucket",
      objectPath: "runtime.yaml",
      storagePath: "gs://workflow-bucket/runtime.yaml",
      rowId: "workflow-row-1",
    });
    mockedGetSchiftClient.mockReturnValue(null);
    mockDownload.mockResolvedValue([Buffer.from(workflowYaml)]);
    mockSave.mockResolvedValue(undefined);
    (recordAdminWorkflowYamlSave as jest.Mock).mockResolvedValue(undefined);
    (refreshWorkflowFromStorage as jest.Mock).mockResolvedValue({
      name: "테스트 워크플로우",
      adminMetadata: {},
      graph: { blocks: [], edges: [] },
    });
  });

  it("exposes YAML top-level settings as a visual workflow block", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/admin/workflow-rules/yaml-workflows/monolith",
      ) as never,
      { params: Promise.resolve({ name: "monolith" }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.graph.blocks[0]).toEqual(
      expect.objectContaining({
        id: "__workflow_settings",
        type: "workflow_settings",
        title: "YAML 전역 설정",
        config: expect.objectContaining({
          chat_flow: expect.objectContaining({
            stages: expect.objectContaining({
              question_answer: expect.objectContaining({
                reflection_loop: expect.objectContaining({
                  max_user_turns_per_question: 5,
                }),
              }),
            }),
          }),
          prompts: { system: "시스템 프롬프트" },
        }),
      }),
    );
    expect(body.graph.blocks[1]).toEqual(
      expect.objectContaining({ id: "start", type: "start" }),
    );
  });

  it("round-trips visual settings back to YAML without persisting the synthetic block", async () => {
    const response = await PATCH(
      new Request(
        "http://localhost/api/admin/workflow-rules/yaml-workflows/monolith",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            graph: {
              blocks: [
                {
                  id: "__workflow_settings",
                  type: "workflow_settings",
                  title: "YAML 전역 설정",
                  config: {
                    chat_flow: {
                      stages: {
                        question_answer: {
                          reflection_loop: {
                            min_user_turns_before_next: 3,
                            max_user_turns_per_question: 6,
                          },
                        },
                      },
                    },
                    prompts: {
                      system: "수정된 시스템 프롬프트",
                    },
                  },
                },
                {
                  id: "start",
                  type: "start",
                  title: "시작",
                  config: {},
                },
              ],
              edges: [],
            },
          }),
        },
      ) as never,
      { params: Promise.resolve({ name: "monolith" }) },
    );

    expect(response.status).toBe(200);
    const savedYamlText = mockSave.mock.calls[0][0] as string;
    const savedYaml = parseYaml(savedYamlText) as {
      chat_flow: {
        stages: {
          question_answer: {
            reflection_loop: {
              min_user_turns_before_next: number;
              max_user_turns_per_question: number;
            };
          };
        };
      };
      prompts: Record<string, string>;
      blocks: Array<{ id: string; type: string }>;
    };

    expect(savedYaml.chat_flow.stages.question_answer.reflection_loop).toEqual({
      min_user_turns_before_next: 3,
      max_user_turns_per_question: 6,
    });
    expect(savedYaml.prompts).toEqual({
      system: "수정된 시스템 프롬프트",
    });
    expect(savedYaml.blocks).toEqual([
      { id: "start", type: "start", title: "시작", config: {} },
    ]);
    expect(recordAdminWorkflowYamlSave).toHaveBeenCalledWith(
      expect.objectContaining({ routeName: "monolith" }),
      savedYamlText,
    );
    expect(refreshWorkflowFromStorage).toHaveBeenCalled();
  });
});
