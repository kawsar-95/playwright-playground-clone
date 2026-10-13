import type { PageModule } from "../../pageTypes";
import ApiPlayground from "./ApiPlayground";
import ApiTesting from "./ApiTesting";
import Mocking from "./Mocking";
import apiSolution from "../../../e2e/network/api.spec.ts?raw";
import apiTestingSolution from "../../../e2e/network/api-testing.spec.ts?raw";
import mockingSolution from "../../../e2e/network/mocking.spec.ts?raw";
import "./network.css";

export const pages: Record<string, PageModule> = {
  "/network/api": {
    Component: ApiPlayground,
    brief: {
      goal: "Check both what the UI shows and what went over the network.",
      steps: [
        'Click "GET Users", wait for the response, and assert that the table has one row for each user in the response body.',
        'Click "GET Missing User" and assert that the response status is 404 and that the page shows it.',
        "Create a user with the form. Use waitForRequest to assert the exact JSON body that the page sent.",
        "Send the form with empty names. Assert the 400 response and the error that the page shows.",
        'Click "GET Products — 2s Delay" and assert that the loading state appears and then goes away.',
      ],
      apis: [
        "page.waitForResponse()",
        "page.waitForRequest()",
        "request.postDataJSON()",
        "response.json()",
        "page.on('response')",
      ],
      hint: "Start the wait before the click. For the create request, use a predicate that checks the method and the URL. GET Users uses the same URL.",
    },
    solution: apiSolution,
  },
  "/network/api-testing": {
    Component: ApiTesting,
    brief: {
      goal: "Test the practice API directly with the request fixture, without a browser.",
      steps: [
        "Send GET /api/users and assert that the seed users are present. Do not assert the exact count.",
        "Create a user. Assert 201, the shape of the response and the Location header. Then delete the user.",
        "Assert the 400 errors for a missing field and for an invalid role, with the error messages.",
        "Show the difference between PUT and PATCH. Send only a role with each one and compare the results.",
        "Log in with /api/auth/login. Then call /api/me with the bearer token and without it.",
        "Create a user through the API. Then check that the user appears on the API Playground page.",
      ],
      apis: [
        "request.get()",
        "request.post()",
        "request.put()",
        "request.patch()",
        "request.delete()",
        "toBeOK",
        "expect.objectContaining()",
        "playwright.request.newContext()",
        "extraHTTPHeaders",
      ],
      hint: "Tests run in parallel against one shared API. Create data with a unique name, for example a name with Date.now(), and delete it at the end. Never call /api/reset from a test.",
    },
    solution: apiTestingSolution,
  },
  "/network/mocking": {
    Component: Mocking,
    brief: {
      goal: "Control network responses to test states that a real backend seldom gives you.",
      steps: [
        "Return mocked products and assert that only those products show.",
        "Return a 500 error and assert the error message. Then abort the request and assert that the page still works.",
        "Delay the real request with route.continue() and assert the loading state.",
        'Mock only the searches for "phone" with a regex route and assert the results. Other searches must still reach the real API.',
        "Use route.fetch() to add one product to the real search results.",
        "Make the notifications request fail one time with { times: 1 }. Assert the error, click Retry and assert the real notifications.",
      ],
      apis: [
        "page.route()",
        "route.fulfill()",
        "route.abort()",
        "route.continue()",
        "route.fetch()",
        "route.fallback()",
        "{ times: 1 }",
        "page.routeFromHAR()",
      ],
      hint: "The glob '**/api/products' does not match a URL with a query string. Use a regex or a predicate for the search scenarios.",
    },
    solution: mockingSolution,
  },
};
