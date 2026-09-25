import type { CueSceneIssue } from "../../types/CueScene";

/** 保存被拦下时逐条列出原因 */
export function IssueBanner({ issues }: { issues: CueSceneIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="issue-banner" role="alert">
      <strong>保存未通过，已停下：</strong>
      <ul>
        {issues.map((issue, index) => (
          <li key={`${issue.code}-${index}`} data-field={issue.field ?? ""}>
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
