import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import {
  normalizeLetterReflectionLoopPolicy,
  type LetterReflectionLoopPolicy,
} from "@gynecology-chatbot/mobile-api/chat/letter-reflection-postprocess";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { refreshWorkflowFromStorage } from "@/lib/mobile/workflows/load-workflow-yaml";
import {
  recordAdminWorkflowYamlSave,
  resolveAdminWorkflowYamlLocation,
} from "@/lib/admin/workflow-yaml-location";

type WorkflowYaml = {
  chat_flow?: unknown;
  [key: string]: unknown;
};

function getStorage() {
  return new Storage({
    projectId:
      process.env.GCS_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      undefined,
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toYamlReflectionLoop(policy: LetterReflectionLoopPolicy) {
  return {
    min_user_turns_before_next: policy.minUserTurnsBeforeNext,
    max_user_turns_per_question: policy.maxUserTurnsPerQuestion,
    quick_reply_mode: policy.quickReplyMode,
    wrap_up_message: policy.wrapUpMessage,
    next_question_label_template: policy.nextQuestionLabelTemplate,
    next_question_message: policy.nextQuestionMessage,
    exhausted_free_chat_message: policy.exhaustedFreeChatMessage,
  };
}

async function readRuntimeYaml() {
  const location = await resolveAdminWorkflowYamlLocation("monolith");
  if (!location) throw new Error("runtime YAML location is not configured");
  const [buffer] = await getStorage()
    .bucket(location.bucket)
    .file(location.objectPath)
    .download();
  return {
    yaml: parseYaml(buffer.toString("utf-8")) as WorkflowYaml,
    location,
  };
}

async function saveRuntimeYaml(
  input: Awaited<ReturnType<typeof readRuntimeYaml>>,
) {
  const yamlText = stringifyYaml(input.yaml);
  await getStorage()
    .bucket(input.location.bucket)
    .file(input.location.objectPath)
    .save(yamlText, {
      resumable: false,
      contentType: "text/yaml",
      validation: false,
    });
  await recordAdminWorkflowYamlSave(input.location, yamlText);
  await refreshWorkflowFromStorage();
}

function readReflectionLoop(yaml: WorkflowYaml) {
  const chatFlow = asRecord(yaml.chat_flow);
  const stages = asRecord(chatFlow.stages);
  const questionAnswer = asRecord(
    stages.question_answer ?? stages.questionAnswer,
  );
  return normalizeLetterReflectionLoopPolicy(
    questionAnswer.reflection_loop ?? questionAnswer.reflectionLoop,
  );
}

function writeReflectionLoop(
  yaml: WorkflowYaml,
  reflectionLoop: LetterReflectionLoopPolicy,
) {
  const chatFlow = asRecord(yaml.chat_flow);
  const stages = asRecord(chatFlow.stages);
  const questionAnswer = asRecord(
    stages.question_answer ?? stages.questionAnswer,
  );

  yaml.chat_flow = {
    ...chatFlow,
    stages: {
      ...stages,
      question_answer: {
        ...questionAnswer,
        reflection_loop: toYamlReflectionLoop(reflectionLoop),
      },
    },
  };
}

export async function GET() {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { yaml, location } = await readRuntimeYaml();
    return NextResponse.json({
      reflectionLoop: readReflectionLoop(yaml),
      storagePath: location.storagePath,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const runtimeYaml = await readRuntimeYaml();
    const body = (await request.json()) as Record<string, unknown>;
    const current = readReflectionLoop(runtimeYaml.yaml);
    const next = normalizeLetterReflectionLoopPolicy(
      body.reflectionLoop ?? body.reflection_loop ?? body,
      current,
    );
    writeReflectionLoop(runtimeYaml.yaml, next);
    await saveRuntimeYaml(runtimeYaml);

    return NextResponse.json({
      reflectionLoop: next,
      storagePath: runtimeYaml.location.storagePath,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed" },
      { status: 500 },
    );
  }
}
