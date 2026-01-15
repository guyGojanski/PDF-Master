import { Server, XCircle } from 'lucide-react';

interface ServerStatusProps {
  isConnected: boolean | null;
  status: string;
  onCheck: () => void;
}

export function ServerStatus({
  isConnected,
  status,
  onCheck,
}: ServerStatusProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      <h1>PDF System Check 🛠️</h1>
      <div
        style={{
          padding: '30px',
          border: '1px solid #ccc',
          borderRadius: '12px',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          minWidth: '350px',
        }}
      >
        <div
          style={{
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Server
            size={64}
            color={
              isConnected === true
                ? '#10b981'
                : isConnected === false
                  ? '#ef4444'
                  : '#6b7280'
            }
          />
        </div>
        <h3 style={{ margin: '10px 0' }}>Connection Status</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>{status}</p>
        <button
          onClick={onCheck}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
          }}
        >
          Check Connection Now
        </button>
        {isConnected === false && (
          <div
            style={{
              marginTop: '20px',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 'bold',
            }}
          >
            <XCircle size={20} /> No Connection
          </div>
        )}
      </div>
    </div>
  );
}
export default ServerStatus;
