import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { AccountForm } from "@/features/shared/components";

export const Route = createFileRoute(
  "/_authenticated/_setup-complete/account/"
)({
  component: AccountForm,
  head: () => ({
    meta: [
      { content: "Account settings", name: "description" },
      { title: `Account | ${APP_NAME}` },
    ],
  }),
});
