import React from "react";
import { createRoot } from "react-dom/client";
import App from "../../app/page";
import "../../app/globals.css";

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("海斗助手渲染失败", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="app-shell">
          <section className="empty-state" role="alert">
            <h1>页面加载失败</h1>
            <p>请刷新页面重试；如果仍然失败，稍后再访问。</p>
            <button onClick={() => window.location.reload()}>重新加载</button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
