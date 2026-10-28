"use client";
import { useT } from "@/lib/i18n";
import { PageHead } from "@/components/ui";
import DocsPanel from "@/components/DocsPanel";

export default function DocsPage() {
  const t = useT();
  return (
    <>
      <PageHead title="Docs" sub={t("docsSub")} />
      <DocsPanel />
    </>
  );
}
