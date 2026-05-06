// @ts-nocheck
import { useLocalSearchParams } from "expo-router";
import { ChatScreen } from "../../src/screens/ChatScreen";

export default function ChatRoute() {
  const { sessionId, readOnly } = useLocalSearchParams<{
    sessionId?: string;
    readOnly?: string;
  }>();
  const forceReadOnly = readOnly === "1" || readOnly === "true";

  return (
    <ChatScreen sessionId={sessionId ?? "new"} forceReadOnly={forceReadOnly} />
  );
}
