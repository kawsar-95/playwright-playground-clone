import type { PageModule } from "../../pageTypes";
import "./auth.css";
import SignIn from "./SignIn";
import signInSolution from "../../../e2e/auth/sign-in.spec.ts?raw";

export const pages: Record<string, PageModule> = {
  "/auth/sign-in": {
    Component: SignIn,
    brief: {
      goal: "Test a sign-in session. Then reuse it so that other tests start signed in.",
      steps: [
        "Sign in with a wrong password. Assert the error.",
        "Sign in with the demo credentials. Assert the account view: the username and where the session is stored.",
        "Reload the page. Assert that you are still signed in.",
        'Sign in without "Remember me", open this page in a new tab, and assert that the new tab shows the sign-in form. Repeat with "Remember me" checked.',
        "Sign out. Assert that the sign-in form is back.",
        'Write a setup test that signs in with "Remember me" checked and saves the state to playwright/.auth/user.json. Then write a test that starts from that file, already signed in.',
        'Repeat the setup without "Remember me". Explain why the signed-in test now fails.',
      ],
      apis: ["context.storageState()", "test.use({ storageState })", "setup projects", "context.newPage()", "page.reload()"],
      hint: "sessionStorage belongs to one tab. localStorage is shared by every tab of the site. storageState() saves localStorage and cookies, but not sessionStorage.",
    },
    solution: signInSolution,
  },
};
