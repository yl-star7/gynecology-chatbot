import { MockAdminContentPortAdapter } from "@/lib/admin/adapters/mock-admin-content-port";
import {
  getWeekStatusBadge,
  getWeekStatusLabel,
} from "@/components/admin/admin-dashboard-labels";
import styles from "@/components/admin/AdminConsoleLayout.module.css";

function getDayReviewRows(
  week: Awaited<ReturnType<MockAdminContentPortAdapter["getWeek"]>>,
) {
  if (!week) {
    return [];
  }

  return [...week.days]
    .sort((left, right) => left.dayNumber - right.dayNumber)
    .map((day) => {
      const checklistCount = week.sections.filter(
        (section) => section.dayNumber === day.dayNumber,
      ).length;
      const questionCount = week.assets.filter(
        (asset) => asset.dayNumber === day.dayNumber,
      ).length;
      const fetalCount = day.babyDevelopmentItems.filter((item) =>
        item.trim(),
      ).length;
      const maternalCount = day.motherChangesItems.filter((item) =>
        item.trim(),
      ).length;
      const status =
        fetalCount > 0 &&
        maternalCount > 0 &&
        checklistCount > 0 &&
        questionCount > 0
          ? "complete"
          : fetalCount > 0 ||
              maternalCount > 0 ||
              checklistCount > 0 ||
              questionCount > 0
            ? "partial"
            : "empty";

      return {
        dayNumber: day.dayNumber,
        title: day.title?.trim() || `Day ${day.dayNumber}`,
        fetalCount,
        maternalCount,
        checklistCount,
        questionCount,
        babyMessage: day.babyMessage?.trim() ?? "",
        status,
      };
    });
}

export default async function AdminContentWeeksPreviewPage() {
  const contentPort = new MockAdminContentPortAdapter();
  const weekSummaries = await contentPort.listWeeks();
  const selectedWeekSummary = weekSummaries[0] ?? null;
  const selectedWeekDetail = selectedWeekSummary
    ? await contentPort.getWeek(selectedWeekSummary.weekNumber)
    : null;
  const dayRows = getDayReviewRows(selectedWeekDetail);

  return (
    <main className={styles.consoleRoot}>
      <aside className={styles.sidebar}>
        <div>
          <h1 className={styles.brandHeading}>운영 제어 센터</h1>
          <p className={styles.brandCopy}>
            주차 원문과 DB 구조를 맞춰서 검수하는 프리뷰 화면입니다.
          </p>
        </div>
        <nav aria-label="관리자 탐색" className={styles.nav}>
          <a className={styles.navItem} href="/admin/operations">
            운영 상태
          </a>
          <a className={styles.navItem} href="/admin/accounts">
            계정
          </a>
          <div className={styles.navGroup}>
            <div className={`${styles.navItem} ${styles.navItemActive}`}>
              콘텐츠
            </div>
            <div className={styles.subnav}>
              <a className={styles.subnavItem} href="/admin/content/documents">
                문서
              </a>
              <a className={styles.subnavItem} href="/admin/content/static">
                정적 문헌
              </a>
              <a
                className={`${styles.subnavItem} ${styles.subnavItemActive}`}
                href="/admin/content/weeks-preview"
              >
                주차 데이터 프리뷰
              </a>
              <a className={styles.subnavItem} href="/admin/content/policies">
                응답 정책
              </a>
            </div>
          </div>
        </nav>
      </aside>

      <section className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLead}>
            <h2 className={styles.topbarHeading}>주차 데이터 프리뷰</h2>
          </div>
        </header>

        <div className={styles.content}>
          <section className={styles.sectionStack}>
            <section className={styles.panel}>
              <div className={styles.routeHeader}>
                <div>
                  <h2 className={styles.routeTitle}>주차 데이터</h2>
                  <p className={styles.panelDescription}>
                    원문 문서와 같은 흐름으로 주차를 검수하고, 필요할 때만 우측 편집
                    패널에서 세부 내용을 수정하는 레이아웃 프리뷰입니다.
                  </p>
                </div>
                <div className={styles.topbarActions}>
                  <button className={styles.primaryButton} type="button">
                    선택 주차 편집
                  </button>
                </div>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.panelStat}>
                  <span className={styles.metaLabel}>전체 주차</span>
                  <strong>{weekSummaries.length}</strong>
                </div>
                <div className={styles.panelStat}>
                  <span className={styles.metaLabel}>게시중</span>
                  <strong>
                    {weekSummaries.filter((week) => week.status === "published").length}
                  </strong>
                </div>
                <div className={styles.panelStat}>
                  <span className={styles.metaLabel}>초안</span>
                  <strong>
                    {weekSummaries.filter((week) => week.status === "draft").length}
                  </strong>
                </div>
                <div className={styles.panelStat}>
                  <span className={styles.metaLabel}>최근 업데이트</span>
                  <strong>{weekSummaries[0]?.updatedAt ?? "-"}</strong>
                </div>
              </div>
            </section>

            <section className={styles.weekWorkspace}>
              <aside className={styles.weekRail}>
                <section className={styles.panel}>
                  <div className={styles.tableToolbar}>
                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>주차 찾기</span>
                      <input
                        className={styles.fieldInput}
                        defaultValue=""
                        placeholder="주차, 제목, 아기 크기"
                      />
                    </label>
                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>상태</span>
                      <select className={styles.fieldSelect} defaultValue="all">
                        <option value="all">전체</option>
                        <option value="draft">초안</option>
                        <option value="published">게시중</option>
                        <option value="archived">보관</option>
                      </select>
                    </label>
                  </div>

                  <div className={styles.weekRegistry}>
                    {weekSummaries.slice(0, 8).map((week) => (
                      <button
                        key={week.id}
                        className={`${styles.weekRegistryRow} ${
                          selectedWeekSummary?.weekNumber === week.weekNumber
                            ? styles.weekRegistryRowActive
                            : ""
                        }`}
                        type="button"
                      >
                        <div className={styles.weekRegistryPrimary}>
                          <strong>{week.weekNumber}주차</strong>
                          <span>{week.title}</span>
                        </div>
                        <div className={styles.weekRegistryMeta}>
                          <span
                            className={`${styles.statusBadge} ${
                              styles[getWeekStatusBadge(week.status)] ?? ""
                            }`}
                          >
                            {getWeekStatusLabel(week.status)}
                          </span>
                          <small>{week.updatedAt}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </aside>

              <div className={styles.weekWorkspaceMain}>
                {selectedWeekDetail ? (
                  <>
                    <section className={styles.panel}>
                      <div className={styles.panelHeader}>
                        <div>
                          <h3 className={styles.panelTitle}>
                            {selectedWeekDetail.weekNumber}주차 개요
                          </h3>
                          <p className={styles.panelDescription}>
                            주차 메타와 핵심 요약을 먼저 확인한 뒤, 아래 Day 1~7
                            레지스트리에서 누락된 섹션을 검수합니다.
                          </p>
                        </div>
                      </div>

                      <div className={styles.weekHeroGrid}>
                        <div className={styles.weekHeroPrimary}>
                          <div className={styles.weekHeroHeading}>
                            <span className={styles.metaLabel}>선택 주차</span>
                            <h4>{selectedWeekDetail.title}</h4>
                          </div>
                          <div className={styles.badgeRow}>
                            <span
                              className={`${styles.statusBadge} ${
                                styles[getWeekStatusBadge(selectedWeekDetail.status)] ??
                                ""
                              }`}
                            >
                              {getWeekStatusLabel(selectedWeekDetail.status)}
                            </span>
                            <span className={styles.tag}>
                              아기 크기 {selectedWeekDetail.babySizeLabel || "-"}
                            </span>
                            <span className={styles.tag}>
                              비교 {selectedWeekDetail.babySizeCompareObject || "-"}
                            </span>
                          </div>
                          <div className={styles.weekSummaryGrid}>
                            <article className={styles.weekSummaryCard}>
                              <span className={styles.metaLabel}>오늘 아기는요</span>
                              <p>{selectedWeekDetail.babySummary}</p>
                            </article>
                            <article className={styles.weekSummaryCard}>
                              <span className={styles.metaLabel}>오늘 엄마는요</span>
                              <p>{selectedWeekDetail.motherSummary}</p>
                            </article>
                          </div>
                        </div>

                        <div className={styles.weekHeroMeta}>
                          <div className={styles.panelStat}>
                            <span className={styles.metaLabel}>Day 수</span>
                            <strong>{selectedWeekDetail.days.length}</strong>
                          </div>
                          <div className={styles.panelStat}>
                            <span className={styles.metaLabel}>체크리스트</span>
                            <strong>{selectedWeekDetail.sections.length}</strong>
                          </div>
                          <div className={styles.panelStat}>
                            <span className={styles.metaLabel}>질문</span>
                            <strong>{selectedWeekDetail.assets.length}</strong>
                          </div>
                          <div className={styles.panelStat}>
                            <span className={styles.metaLabel}>이미지</span>
                            <strong>{selectedWeekDetail.media.length}</strong>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className={styles.panel}>
                      <div className={styles.panelHeader}>
                        <div>
                          <h3 className={styles.panelTitle}>Day 1~7 검수</h3>
                          <p className={styles.panelDescription}>
                            태아 발달정보, 모체 변화정보, 생활 체크리스트, 태교 질문이
                            각각 얼마나 채워졌는지 한눈에 봅니다.
                          </p>
                        </div>
                      </div>

                      <div className={styles.weekDayList}>
                        {dayRows.map((day) => (
                          <article key={day.dayNumber} className={styles.weekDayRow}>
                            <div className={styles.weekDayLead}>
                              <div>
                                <span className={styles.metaLabel}>
                                  Day {day.dayNumber}
                                </span>
                                <h4>{day.title}</h4>
                              </div>
                              <span
                                className={`${styles.statusBadge} ${
                                  day.status === "complete"
                                    ? styles.statusSuccess
                                    : day.status === "partial"
                                      ? styles.statusWarning
                                      : styles.statusMuted
                                }`}
                              >
                                {day.status === "complete"
                                  ? "검수 가능"
                                  : day.status === "partial"
                                    ? "보완 필요"
                                    : "미작성"}
                              </span>
                            </div>

                            <div className={styles.weekDaySections}>
                              <div className={styles.weekDaySectionCell}>
                                <strong>태아 발달정보</strong>
                                <span>{day.fetalCount}개 문단</span>
                              </div>
                              <div className={styles.weekDaySectionCell}>
                                <strong>모체 변화정보</strong>
                                <span>{day.maternalCount}개 문단</span>
                              </div>
                              <div className={styles.weekDaySectionCell}>
                                <strong>생활 체크리스트</strong>
                                <span>{day.checklistCount}개 항목</span>
                              </div>
                              <div className={styles.weekDaySectionCell}>
                                <strong>태교 질문</strong>
                                <span>{day.questionCount}개 항목</span>
                              </div>
                            </div>

                            {day.babyMessage ? (
                              <p className={styles.weekDayMessage}>
                                <span className={styles.metaLabel}>아기의 말</span>
                                {day.babyMessage}
                              </p>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </section>
                  </>
                ) : null}
              </div>
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}
