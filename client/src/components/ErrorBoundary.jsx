import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI crashed:", error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold">something broke</h1>
            <p className="mt-2 text-sm text-zinc-400">
              the page hit an unexpected error. you can try again or reload.
            </p>
            <pre className="mt-4 text-xs text-zinc-500 text-left bg-zinc-900 border border-zinc-800 rounded p-3 overflow-x-auto">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Button variant="outline" onClick={this.handleReset}>try again</Button>
              <Button onClick={this.handleReload}>
                <RefreshCw className="h-4 w-4" /> reload
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
