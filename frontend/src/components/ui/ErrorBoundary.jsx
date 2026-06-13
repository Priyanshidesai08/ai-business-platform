import React from 'react';
import Button from './Button.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-[var(--ui-background)] p-6 text-center">
          <div className="max-w-lg rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-[var(--ui-shadow)]">
            <h1 className="text-xl font-semibold text-[var(--ui-text)]">Something interrupted the workspace.</h1>
            <p className="mt-2 text-sm text-[var(--ui-text-muted)]">The interface hit an unexpected state. Reloading usually restores the session.</p>
            <Button className="mt-5" onClick={() => window.location.reload()}>Reload app</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
