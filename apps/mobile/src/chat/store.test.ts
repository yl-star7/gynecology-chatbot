import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ChatSession } from "@gynecology-chatbot/app-core";
import { ChatSessionsProvider, useChatSessions } from "./store.tsx";

function installDom() {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.window = dom.window;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: dom.window.navigator,
  });

  return dom;
}

type ChatSessionsValue = ReturnType<typeof useChatSessions>;

function Probe({ onRender }: { onRender: (value: ChatSessionsValue) => void }) {
  const value = useChatSessions();
  onRender(value);
  return null;
}

test("chat session mutators stay stable after session state changes", async () => {
  const dom = installDom();
  const container = dom.window.document.getElementById("root");
  assert.ok(container);

  const renders: ChatSessionsValue[] = [];
  let root: Root | null = createRoot(container);

  await act(async () => {
    root?.render(
      React.createElement(
        ChatSessionsProvider,
        { userId: "user-1" },
        React.createElement(Probe, {
          onRender(value: ChatSessionsValue) {
            renders.push(value);
          },
        }),
      ),
    );
  });

  const initialValue = renders.at(-1);
  assert.ok(initialValue);

  const session: ChatSession = {
    id: "session-1",
    title: "아기와 대화",
    messages: [],
  };

  await act(async () => {
    initialValue.replaceSession(session.id, session);
  });

  const nextValue = renders.at(-1);
  assert.ok(nextValue);
  assert.equal(nextValue.replaceSession, initialValue.replaceSession);
  assert.equal(nextValue.appendMessage, initialValue.appendMessage);

  await act(async () => {
    root?.unmount();
  });
  root = null;
  dom.window.close();
});
