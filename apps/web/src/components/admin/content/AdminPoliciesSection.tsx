"use client";

import { useState } from "react";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import {
  getWorkflowStatusBadge,
  getWorkflowStatusLabel,
} from "../admin-dashboard-labels";
import styles from "../AdminConsoleLayout.module.css";
import { AdminWorkflowEditorAdapter } from "./AdminWorkflowEditorAdapter";

export interface AdminPoliciesSectionProps {
  workflowRules: AdminDashboardData["workflowRules"];
  selectedWorkflowRuleId: string;
  contentMessage: string | null;
  workflowName: string;
  workflowTrigger: string;
  workflowRetrievalScope: string;
  workflowModelName: string;
  workflowStatus: AdminDashboardData["workflowRules"][number]["status"];
  isWorkflowSaving: boolean;
  isWorkflowBootstrapping: boolean;
  onSelectWorkflowRule: (id: string) => void;
  onWorkflowNameChange: (value: string) => void;
  onWorkflowTriggerChange: (value: string) => void;
  onWorkflowRetrievalScopeChange: (value: string) => void;
  onWorkflowModelNameChange: (value: string) => void;
  onWorkflowStatusChange: (
    value: AdminDashboardData["workflowRules"][number]["status"],
  ) => void;
  onSaveWorkflowRule: () => Promise<void>;
  onBootstrapWorkflowRule: () => Promise<void>;
}

type View = { mode: "list" } | { mode: "editor"; workflowId: string | null };

export function AdminPoliciesSection({
  workflowRules,
  selectedWorkflowRuleId,
  contentMessage,
  workflowName,
  workflowTrigger,
  workflowRetrievalScope,
  workflowModelName,
  workflowStatus,
  isWorkflowSaving,
  isWorkflowBootstrapping,
  onSelectWorkflowRule,
  onWorkflowNameChange,
  onWorkflowTriggerChange,
  onWorkflowRetrievalScopeChange,
  onWorkflowModelNameChange,
  onWorkflowStatusChange,
  onSaveWorkflowRule,
  onBootstrapWorkflowRule,
}: AdminPoliciesSectionProps) {
  const [view, setView] = useState<View>({ mode: "list" });
  const [activeOverlay, setActiveOverlay] = useState(false);
  const [workflowQuery, setWorkflowQuery] = useState("");
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState("all");

  const filteredWorkflowRules = workflowRules.filter((rule) => {
    const query = workflowQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      rule.name.toLowerCase().includes(query) ||
      rule.trigger.toLowerCase().includes(query) ||
      rule.modelName.toLowerCase().includes(query);
    const matchesStatus =
      workflowStatusFilter === "all" || rule.status === workflowStatusFilter;
    return matchesQuery && matchesStatus;
  });

  if (view.mode === "editor") {
    return (
      <section className={styles.sectionStack}>
        <section className={styles.panel} style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ height: "calc(100vh - 100px)", minHeight: 500 }}>
            <AdminWorkflowEditorAdapter
              workflowId={view.workflowId}
              onBack={() => setView({ mode: "list" })}
            />
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className={styles.sectionStack}>
      <section className={styles.panel}>
        <div className={styles.routeHeader}>
          <h2 className={styles.routeTitle}>응답 워크플로우</h2>
          <div className={styles.topbarActions}>
            <input
              className={styles.fieldInput}
              value={workflowQuery}
              onChange={(event) => setWorkflowQuery(event.target.value)}
              placeholder="검색"
              style={{ width: 160 }}
            />
            <select
              className={styles.fieldSelect}
              value={workflowStatusFilter}
              onChange={(event) => setWorkflowStatusFilter(event.target.value)}
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="review">검토중</option>
            </select>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => setView({ mode: "editor", workflowId: null })}
            >
              노드 에디터
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={isWorkflowBootstrapping}
              onClick={() => void onBootstrapWorkflowRule()}
            >
              {isWorkflowBootstrapping
                ? "만드는 중…"
                : "기본 워크플로우"}
            </button>
          </div>
        </div>

        <div className={styles.dataTable}>
          <div className={styles.dataTableHeader} style={{ gridTemplateColumns: "1.5fr 1fr 1fr 80px" }}>
            <span>워크플로우</span>
            <span>트리거</span>
            <span>모델</span>
            <span>상태</span>
          </div>
          {filteredWorkflowRules.map((rule) => (
            <button
              key={rule.id}
              className={`${styles.dataTableRow} ${
                selectedWorkflowRuleId === rule.id
                  ? styles.dataTableRowActive
                  : ""
              }`}
              type="button"
              style={{ gridTemplateColumns: "1.5fr 1fr 1fr 80px" }}
              onClick={() => {
                setView({ mode: "editor", workflowId: rule.id });
              }}
            >
              <span className={styles.dataTableTitleGroup}>
                <strong>{rule.name}</strong>
              </span>
              <span>{rule.trigger}</span>
              <span style={{ fontSize: "12px" }}>{rule.modelName}</span>
              <span>
                <span
                  className={`${styles.statusBadge} ${
                    styles[getWorkflowStatusBadge(rule.status)] ?? ""
                  }`}
                >
                  {getWorkflowStatusLabel(rule.status)}
                </span>
              </span>
            </button>
          ))}
          {filteredWorkflowRules.length === 0 ? (
            <div className={styles.listEmpty}>조건에 맞는 워크플로우가 없습니다.</div>
          ) : null}
        </div>
      </section>

      {activeOverlay ? (
        <>
          <button
            aria-label="패널 닫기"
            className={styles.overlayBackdrop}
            type="button"
            onClick={() => setActiveOverlay(false)}
          />
          <aside className={styles.overlayPanel}>
            <div className={styles.overlayHeader}>
              <h3 className={styles.panelTitle}>워크플로우 편집</h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  className={styles.fieldSelect}
                  value={workflowStatus}
                  onChange={(event) =>
                    onWorkflowStatusChange(
                      event.target.value as AdminDashboardData["workflowRules"][number]["status"],
                    )
                  }
                >
                  <option value="active">활성</option>
                  <option value="review">검토중</option>
                </select>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setActiveOverlay(false)}
                >
                  닫기
                </button>
              </div>
            </div>
            <div className={styles.overlayBody}>
              {contentMessage ? <p className={styles.formHint}>{contentMessage}</p> : null}
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>이름</span>
                <input
                  className={styles.fieldInput}
                  value={workflowName}
                  onChange={(event) => onWorkflowNameChange(event.target.value)}
                />
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>트리거</span>
                <input
                  className={styles.fieldInput}
                  value={workflowTrigger}
                  onChange={(event) => onWorkflowTriggerChange(event.target.value)}
                />
              </label>
              <div className={styles.panelGrid}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>검색 범위</span>
                  <input
                    className={styles.fieldInput}
                    value={workflowRetrievalScope}
                    onChange={(event) =>
                      onWorkflowRetrievalScopeChange(event.target.value)
                    }
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>모델</span>
                  <input
                    className={styles.fieldInput}
                    value={workflowModelName}
                    onChange={(event) => onWorkflowModelNameChange(event.target.value)}
                  />
                </label>
              </div>
            </div>
            <div className={styles.overlayFooter}>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={isWorkflowSaving || !selectedWorkflowRuleId}
                onClick={onSaveWorkflowRule}
              >
                워크플로우 저장
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </section>
  );
}
