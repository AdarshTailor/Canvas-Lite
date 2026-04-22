import React from 'react';

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
        <div style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '12px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          backgroundColor: '#f8f9fa',
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <h2 style={{ color: '#333', margin: 0, fontSize: '22px' }}>Something went wrong</h2>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Try refreshing the page</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '8px',
              padding: '8px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
