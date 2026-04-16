import { Image } from "react-native";
import { buildPrefetchPlan, parsePregnancyWeekLabel } from "./week-baby-images";

const requested = new Set<string>();

function prefetchOne(uri: string): Promise<void> {
  if (requested.has(uri)) {
    return Promise.resolve();
  }
  requested.add(uri);
  return Image.prefetch(uri).then(
    () => undefined,
    () => {
      // 실패 시 재시도 가능하도록 제거
      requested.delete(uri);
    },
  );
}

async function prefetchSequential(uris: string[]): Promise<void> {
  for (const uri of uris) {
    await prefetchOne(uri);
  }
}

function scheduleIdle(callback: () => void) {
  // requestIdleCallback이 없으면 setTimeout으로 대체
  const idle = (
    globalThis as { requestIdleCallback?: (cb: () => void) => void }
  ).requestIdleCallback;
  if (typeof idle === "function") {
    idle(callback);
    return;
  }
  setTimeout(callback, 0);
}

export function prefetchWeekBabyImages(weekLabel?: string | null): void {
  const week = parsePregnancyWeekLabel(weekLabel);
  const { priority, deferred } = buildPrefetchPlan(week);

  // 우선순위 이미지: 병렬로 즉시
  priority.forEach((uri) => {
    prefetchOne(uri).catch(() => undefined);
  });

  // 나머지: idle 시점에 순차 로드 (대역폭 배려)
  if (deferred.length === 0) return;
  scheduleIdle(() => {
    prefetchSequential(deferred).catch(() => undefined);
  });
}

// 테스트 용도: 모듈 내부 상태를 초기화
export function __resetPrefetchCacheForTests(): void {
  requested.clear();
}
