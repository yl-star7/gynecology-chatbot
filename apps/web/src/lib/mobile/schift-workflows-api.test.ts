jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseInsert: jest.fn(),
  supabaseSelect: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

jest.mock("@schift-io/sdk", () => {
  type MockBlock = {
    id: string;
    type?: string;
    title?: string;
    config?: Record<string, unknown>;
  };
  type MockEdge = {
    id: string;
    source: string;
    target: string;
  };

  class WorkflowBuilder {
    private graph: { blocks: MockBlock[]; edges: MockEdge[] } = {
      blocks: [],
      edges: [],
    };

    constructor(_name: string) {}
    description(_value: string) {
      return this;
    }
    addBlock(id: string, config: Record<string, unknown>) {
      this.graph.blocks.push({ id, ...config });
      return this;
    }
    connect(source: string, target: string) {
      this.graph.edges.push({ id: `${source}-${target}`, source, target });
      return this;
    }
    buildGraph() {
      return this.graph;
    }
  }

  return {
    Schift: jest.fn().mockImplementation(() => ({
      workflows: {
        create: jest.fn(async () => ({
          id: "wf-1",
          name: "모성간호 상담 응답",
          graph: { blocks: [{ id: "start" }], edges: [] },
        })),
      },
    })),
    WorkflowBuilder,
  };
});

import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";
import { createDefaultInternalAnswerWorkflow } from "./schift-workflows-api";

describe("createDefaultInternalAnswerWorkflow", () => {
  const originalApiKey = process.env.SCHIFT_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.SCHIFT_API_KEY = "test-key";
    (supabaseSelect as jest.Mock).mockReset();
    (supabaseInsert as jest.Mock).mockReset();
    (supabaseUpdate as jest.Mock).mockReset();
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/v1/workflows")) {
        return {
          ok: true,
          json: async () => [],
        } as Response;
      }
      if (url.includes("/v1/workflows/")) {
        return {
          ok: true,
          json: async () => ({
            id: "wf-1",
            name: "모성간호 상담 응답",
            description: "updated",
            graph: { blocks: [{ id: "start" }], edges: [] },
            status: "published",
          }),
        } as Response;
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;
  });

  afterAll(() => {
    process.env.SCHIFT_API_KEY = originalApiKey;
    global.fetch = originalFetch;
  });

  it("uses provider-aware wrappers when persisting workflow definitions", async () => {
    (supabaseSelect as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (supabaseInsert as jest.Mock).mockResolvedValueOnce([]);

    await createDefaultInternalAnswerWorkflow();

    expect(supabaseSelect).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        "workflow_definitions?select=id,name,slug,provider,status,is_active,config,metadata&id=eq.wf-1",
      ),
    );
    expect(supabaseSelect).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        "workflow_definitions?select=id,name,slug,provider,status,is_active,config,metadata&slug=eq.internal-data-answer",
      ),
    );
    expect(supabaseInsert).toHaveBeenCalledWith(
      "workflow_definitions",
      expect.objectContaining({
        id: "wf-1",
        slug: "internal-data-answer",
        provider: "schift",
      }),
    );
    expect(supabaseUpdate).not.toHaveBeenCalled();
  });

  it("archives malformed canonical workflows and recreates them", async () => {
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (
          url.endsWith("/v1/workflows") &&
          (!init?.method || init.method === "GET")
        ) {
          return {
            ok: true,
            json: async () => [
              {
                id: "wf-broken",
                name: "모성간호 상담 응답",
                status: "published",
                graph: {
                  nodes: [],
                  blocks: [],
                  edges: [{ id: "e1", source: "start", target: "end" }],
                },
              },
            ],
          } as Response;
        }
        if (
          url.includes("/v1/workflows/wf-broken") &&
          init?.method === "PATCH"
        ) {
          return {
            ok: true,
            json: async () => ({ id: "wf-broken", status: "archived" }),
          } as Response;
        }
        if (url.includes("/v1/workflows/") && init?.method === "PATCH") {
          return {
            ok: true,
            json: async () => ({
              id: "wf-1",
              name: "모성간호 상담 응답",
              description: "updated",
              graph: { blocks: [{ id: "start" }], edges: [] },
              status: "published",
            }),
          } as Response;
        }
        throw new Error(`unexpected fetch: ${url}`);
      },
    ) as typeof fetch;

    (supabaseSelect as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (supabaseInsert as jest.Mock).mockResolvedValueOnce([]);

    await createDefaultInternalAnswerWorkflow();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/workflows/wf-broken"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
