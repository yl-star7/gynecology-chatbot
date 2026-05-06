import { render, screen } from "@testing-library/react";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import {
  AdminDocumentsSection,
  type RagFileItem,
} from "./AdminDocumentsSection";

function renderSection(input: {
  ragDocuments?: AdminDashboardData["ragDocuments"];
  ragFiles?: RagFileItem[];
}) {
  return render(
    <AdminDocumentsSection
      ragDocuments={input.ragDocuments ?? []}
      ragFiles={input.ragFiles ?? []}
      selectedRagDocumentId=""
      contentMessage={null}
      ragTitle=""
      ragCategory=""
      ragWeek=""
      ragContent=""
      isRagSubmitting={false}
      isFileUploading={false}
      onSelectRagDocument={jest.fn(async () => undefined)}
      onResetRagDocument={jest.fn()}
      onRagTitleChange={jest.fn()}
      onRagCategoryChange={jest.fn()}
      onRagWeekChange={jest.fn()}
      onRagContentChange={jest.fn()}
      onUploadRagDocument={jest.fn(async () => undefined)}
      onDeleteRagDocument={jest.fn(async () => undefined)}
      onUploadRagFile={jest.fn(async () => undefined)}
      onDeleteRagFile={jest.fn(async () => undefined)}
      onToggleRagFile={jest.fn(async () => undefined)}
    />,
  );
}

describe("AdminDocumentsSection", () => {
  const fileId = "11111111-1111-4111-8111-111111111111";
  const ragFile: RagFileItem = {
    id: fileId,
    filename: "20주 1일차.pdf",
    storagePath: `rag/${fileId}.pdf`,
    schiftBucket: "pregnancy-knowledge",
    fileSize: 1024,
    mimeType: "application/pdf",
    status: "ready",
    enabled: true,
    errorMessage: null,
    createdAt: "2026-03-25T01:45:28.682Z",
    updatedAt: "2026-03-25T01:45:28.682Z",
  };
  const linkedDocument: AdminDashboardData["ragDocuments"][number] = {
    id: "doc-20-day-1",
    title: "20주 1일차",
    pregnancyWeekLabel: "20주차",
    category: "day-content",
    chunkCount: 3,
    updatedAt: "2026-03-25T01:45:28.682Z",
    status: "ready",
    sourceFileId: fileId,
    sourceFilename: "20주 1일차.pdf",
  };

  it("groups processed RAG documents under their source file", () => {
    renderSection({
      ragFiles: [ragFile],
      ragDocuments: [linkedDocument],
    });

    expect(screen.getByText("파일별 RAG 처리")).toBeInTheDocument();
    expect(screen.getByText("20주 1일차.pdf")).toBeInTheDocument();
    expect(screen.getByText("20주 1일차")).toBeInTheDocument();
    expect(screen.getByText("3개")).toBeInTheDocument();
    expect(screen.queryByText("직접 입력 자료")).not.toBeInTheDocument();
  });

  it("keeps documents without file metadata in the direct-input group", () => {
    renderSection({
      ragFiles: [ragFile],
      ragDocuments: [
        {
          ...linkedDocument,
          id: "manual-doc",
          title: "직접 입력 문서",
          sourceFileId: null,
          sourceFilename: null,
        },
      ],
    });

    expect(screen.getByText("20주 1일차.pdf")).toBeInTheDocument();
    expect(screen.getByText("직접 입력 자료")).toBeInTheDocument();
    expect(screen.getByText("직접 입력 문서")).toBeInTheDocument();
  });
});
