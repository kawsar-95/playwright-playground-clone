import { PageHeader, TestCard } from "../../components";
import { usePageTitle } from "./usePageTitle";

export default function NewTabContent() {
  usePageTitle("Help article");
  return (
    <>
      <PageHeader title="Help article">This page was opened in a new browser tab.</PageHeader>
      <TestCard title="Working with tabs">
        <p data-testid="new-tab-message">You successfully opened a new tab.</p>
      </TestCard>
    </>
  );
}
