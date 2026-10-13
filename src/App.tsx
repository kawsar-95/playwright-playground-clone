import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout, { NotFound } from "./Layout";
import Home from "./Home";
import { hiddenPaths, redirects, allPages } from "./nav";
import { registry } from "./pages/registry";
import { ProgressProvider } from "./progress";

const paths = [...allPages.map((p) => p.path), ...hiddenPaths];

export default function App() {
  return (
    <ProgressProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            {paths.map((path) => {
              const { Component } = registry[path];
              return <Route key={path} path={path} element={<Component />} />;
            })}
            {redirects.map((r) => (
              <Route key={r.from} path={r.from} element={<Navigate to={r.to} replace />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProgressProvider>
  );
}
