export {
    generateEmbedding,
    generateQueryEmbedding,
    searchPregnancyDocuments,
    ingestDocument,
    buildRAGContext,
    deleteDocumentsBySourceFile,
    getDocumentStats,
} from "./pgvector-rag";

export {
    parseDocx,
    ingestDocxFile,
    bulkIngestDocxFiles,
    extractPregnancyWeekFromFilename,
    detectCategory,
} from "./document-ingestion";
