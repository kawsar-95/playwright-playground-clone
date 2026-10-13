import { PageHeader, TestCard } from "../../components";
import { usePageTitle } from "./usePageTitle";

export default function NewWindowContent() {
  usePageTitle("Preview");
  return (
    <>
      <PageHeader title="Preview">This page was opened in a new browser window.</PageHeader>
      <TestCard title="Popup window">
        <p data-testid="new-window-message">You successfully opened a new window.</p>
        <button type="button" onClick={() => window.setTimeout(() => window.close(), 100)}>
          Close window
        </button>
      </TestCard>
    </>
  );
}
