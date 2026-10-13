import { useSearchParams } from "react-router-dom";
import { PageHeader, TestCard } from "../../components";
import { usePageTitle } from "./usePageTitle";

const reports: Record<string, [string, string][]> = {
  Sales: [
    ["Revenue", "$12,400"],
    ["Orders", "310"],
  ],
  Traffic: [
    ["Visitors", "8,950"],
    ["Bounce rate", "41%"],
  ],
  Support: [
    ["Open tickets", "27"],
    ["Median reply", "3 h"],
  ],
};

export default function Report() {
  const [params] = useSearchParams();
  const name = params.get("name") ?? "";
  const figures = Object.hasOwn(reports, name) ? reports[name] : undefined;
  usePageTitle(figures ? `${name} report` : "Report not found");

  if (!figures) {
    return <PageHeader title="Report not found">{`There is no report called "${name}".`}</PageHeader>;
  }
  return (
    <>
      <PageHeader title={`${name} report`}>Last 30 days.</PageHeader>
      <TestCard>
        <dl className="report-figures">
          {figures.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </TestCard>
    </>
  );
}
