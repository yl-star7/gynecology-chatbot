import { Redirect } from "expo-router";

export default function KnowledgeRoute() {
  return <Redirect href={"/encyclopedia" as never} />;
}
