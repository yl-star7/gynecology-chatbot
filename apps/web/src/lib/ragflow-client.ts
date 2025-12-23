/**
 * RAGFlow API 클라이언트
 * 부인과 의료 문서 검색 및 RAG 기능 제공
 */

export interface RAGSearchResult {
  content: string;
  source: string;
  page?: number;
  confidence: number;
  citation: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface RAGSearchRequest {
  query: string;
  top_k?: number;
  include_citations?: boolean;
  confidence_threshold?: number;
  category_filter?: string[];
}

export interface RAGSearchResponse {
  results: RAGSearchResult[];
  total_found: number;
  query_id: string;
  search_time_ms: number;
}

export interface DocumentUploadRequest {
  file: File;
  category: string;
  source: string;
  description?: string;
}

export interface DocumentUploadResponse {
  document_id: string;
  status: 'uploaded' | 'processing' | 'indexed' | 'failed';
  message: string;
}

export class RAGFlowClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'http://localhost:9380', apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // trailing slash 제거
    this.apiKey = apiKey;
  }

  /**
   * 의료 문서 검색
   */
  async search(request: RAGSearchRequest): Promise<RAGSearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          query: request.query,
          top_k: request.top_k || 5,
          include_citations: request.include_citations ?? true,
          confidence_threshold: request.confidence_threshold || 0.7,
          category_filter: request.category_filter
        })
      });

      if (!response.ok) {
        throw new Error(`RAGFlow API 오류: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.processSearchResponse(data);
    } catch (error) {
      console.error('RAGFlow 검색 오류:', error);
      throw new Error('의료 문서 검색 중 오류가 발생했습니다.');
    }
  }

  /**
   * 문서 업로드
   */
  async uploadDocument(request: DocumentUploadRequest): Promise<DocumentUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('category', request.category);
      formData.append('source', request.source);
      if (request.description) {
        formData.append('description', request.description);
      }
      formData.append('enable_citations', 'true');
      formData.append('confidence_threshold', '0.7');

      const response = await fetch(`${this.baseUrl}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`문서 업로드 실패: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('문서 업로드 오류:', error);
      throw new Error('문서 업로드 중 오류가 발생했습니다.');
    }
  }

  /**
   * 업로드된 문서 목록 조회
   */
  async getDocuments(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/documents`, {
        method: 'GET',
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`문서 목록 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error('문서 목록 조회 오류:', error);
      return [];
    }
  }

  /**
   * 문서 통계 조회
   */
  async getDocumentStats(): Promise<{ total: number; categories: Record<string, number> }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/documents/count`, {
        method: 'GET',
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (response.ok) {
        return await response.json();
      }

      // API가 없으면 기본값 반환
      return { total: 0, categories: {} };
    } catch (error) {
      console.error('문서 통계 조회 오류:', error);
      return { total: 0, categories: {} };
    }
  }

  /**
   * 서버 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.error('RAGFlow 서버 상태 확인 실패:', error);
      return false;
    }
  }

  /**
   * 검색 결과 후처리
   */
  private processSearchResponse(data: any): RAGSearchResponse {
    const results: RAGSearchResult[] = (data.results || []).map((result: any) => ({
      content: result.content || result.text || '',
      source: result.source || result.document_name || '알 수 없는 출처',
      page: result.page,
      confidence: result.confidence || result.score || 0,
      citation: result.citation || this.generateCitation(result),
      category: result.category,
      metadata: result.metadata || {}
    }));

    return {
      results,
      total_found: data.total_found || results.length,
      query_id: data.query_id || this.generateQueryId(),
      search_time_ms: data.search_time_ms || 0
    };
  }

  /**
   * 인용문 자동 생성
   */
  private generateCitation(result: any): string {
    const source = result.source || result.document_name || '의료 문서';
    const page = result.page ? `, p.${result.page}` : '';
    const year = new Date().getFullYear();

    return `${source}${page}. ${year}.`;
  }

  /**
   * 쿼리 ID 생성
   */
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 환경 변수에서 RAGFlow 클라이언트 생성
 */
export function createRAGFlowClient(): RAGFlowClient {
  const ragflowUrl = process.env.NEXT_PUBLIC_RAGFLOW_URL || 'http://localhost:9380';
  const apiKey = process.env.RAGFLOW_API_KEY;

  return new RAGFlowClient(ragflowUrl, apiKey);
}

/**
 * 의료 카테고리 정의
 */
export const MEDICAL_CATEGORIES = {
  pregnancy_early: '임신 초기',
  pregnancy_middle: '임신 중기',
  pregnancy_late: '임신 후기',
  prenatal_care: '산전 관리',
  nutrition: '영양 관리',
  postpartum: '산후 관리',
  gynecology: '부인과 일반',
  contraception: '피임',
  menstruation: '월경',
  menopause: '갱년기',
  fertility: '난임',
  general: '일반 의료'
} as const;

export type MedicalCategory = keyof typeof MEDICAL_CATEGORIES;