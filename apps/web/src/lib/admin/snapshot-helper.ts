import { prisma } from "@gynecology-chatbot/db/prisma";
import { resolveAdminActorId } from "./admin-actor";

/**
 * 롤백 1단계 지원: 테이블에 previous_snapshot jsonb 컬럼이 있으면,
 * update 직전에 현재 row를 스냅샷으로 저장한다. 전수 이력은 admin_audit_logs 참조.
 */

type PrismaModelDelegate<TRow> = {
  findUnique(args: { where: { id: string } }): Promise<TRow | null>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<TRow>;
};

export interface SnapshotCapableRow {
  id: string;
  previous_snapshot?: unknown;
  updated_by?: string | null;
  updated_at?: Date | null;
}

export interface SnapshotUpdateInput<TData> {
  model: PrismaModelDelegate<SnapshotCapableRow>;
  id: string;
  data: TData;
  actorId?: string | null;
}

export function toJsonSafeSnapshot(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(toJsonSafeSnapshot);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        toJsonSafeSnapshot(nested),
      ]),
    );
  }
  return value;
}

/**
 * 현재 row를 previous_snapshot에 저장하고 update를 수행한다.
 * 호출자는 data에 updated_by/updated_at을 직접 넣을 필요 없음 — 본 함수가 채운다.
 */
export async function saveSnapshotAndUpdate<
  TData extends Record<string, unknown>,
>(input: SnapshotUpdateInput<TData>): Promise<SnapshotCapableRow> {
  const { model, id, data, actorId } = input;
  // 트랜잭션 없이도 쓰기는 한 row 에 대한 단일 update 이므로 안전하게 동작한다.
  // findUnique → update 사이에 concurrent 편집이 있으면 snapshot 이 살짝 오래된 값이 될 수 있으나,
  // 1 단계 롤백용으로는 허용 가능한 trade-off 이며 이후 admin_audit_logs 가 전수 이력을 보완한다.
  const current = await model.findUnique({ where: { id } });

  let snapshot: Record<string, unknown> | null = null;
  if (current) {
    const { previous_snapshot: _ignored, ...rest } =
      current as unknown as Record<string, unknown>;
    snapshot = toJsonSafeSnapshot(rest) as Record<string, unknown>;
  }

  const dataWithMeta: Record<string, unknown> = {
    ...data,
    previous_snapshot: snapshot,
    updated_at: new Date(),
  };
  if (actorId !== undefined) {
    dataWithMeta.updated_by = await resolveAdminActorId(actorId);
  }

  return model.update({ where: { id }, data: dataWithMeta });
}

/**
 * previous_snapshot을 현재 row에 되돌린다 (1단계 롤백).
 * 스냅샷 자체는 clear되어 다음 편집 시 새 스냅샷이 덮어씌워진다.
 */
export async function rollbackFromSnapshot(
  model: PrismaModelDelegate<SnapshotCapableRow>,
  id: string,
  actorId?: string | null,
): Promise<SnapshotCapableRow | null> {
  const current = await model.findUnique({ where: { id } });
  if (!current) return null;
  const snapshot = current.previous_snapshot as Record<string, unknown> | null;
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  // 스냅샷에서 id / previous_snapshot / timestamps 는 재주입 대상에서 제외
  const {
    id: _omitId,
    previous_snapshot: _omitSnap,
    created_at: _omitCreated,
    ...restore
  } = snapshot;

  const restoreData: Record<string, unknown> = {
    ...restore,
    previous_snapshot: null,
    updated_at: new Date(),
  };
  if (actorId !== undefined) {
    restoreData.updated_by = await resolveAdminActorId(actorId);
  }

  return model.update({ where: { id }, data: restoreData });
}

/**
 * 리소스 이름 → Prisma 모델 delegate 매핑. rollback API 라우트에서 사용.
 */
export function resolveSnapshotModel(
  resource: string,
): PrismaModelDelegate<SnapshotCapableRow> | null {
  const map: Record<string, PrismaModelDelegate<SnapshotCapableRow>> = {
    "pregnancy-week-data":
      prisma.content_pregnancy_week_data as unknown as PrismaModelDelegate<SnapshotCapableRow>,
    "pregnancy-day-contents":
      prisma.content_pregnancy_day_contents as unknown as PrismaModelDelegate<SnapshotCapableRow>,
    "week-checklists":
      prisma.content_week_checklists as unknown as PrismaModelDelegate<SnapshotCapableRow>,
    "week-questions":
      prisma.content_week_questions as unknown as PrismaModelDelegate<SnapshotCapableRow>,
    "knowledge-items":
      prisma.content_knowledge_items as unknown as PrismaModelDelegate<SnapshotCapableRow>,
    "pregnancy-week-media":
      prisma.content_pregnancy_week_media as unknown as PrismaModelDelegate<SnapshotCapableRow>,
    "pregnancy-documents":
      prisma.content_pregnancy_documents as unknown as PrismaModelDelegate<SnapshotCapableRow>,
    "baby-comfort-pool":
      prisma.content_baby_comfort_pool as unknown as PrismaModelDelegate<SnapshotCapableRow>,
    "mood-variants":
      prisma.content_mood_variants as unknown as PrismaModelDelegate<SnapshotCapableRow>,
  };
  return map[resource] ?? null;
}
