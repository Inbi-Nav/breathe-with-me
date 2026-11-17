import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Screen crashed:', error, info?.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="crash" role="alert">
        <h1>Oops, something went wrong</h1>
        <p>Nothing is lost. Your saved results are still on this computer.</p>
        <button type="button" className="btn btn-primary" onClick={this.reset}>Back to dashboard</button>
        <details open>
          <summary>Error details (send this to the developer)</summary>
          <pre>{String(error?.stack || error?.message || error).slice(0, 1800)}</pre>
        </details>
      </div>
    );
  }
}
