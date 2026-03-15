import React from 'react';

interface LoadingScreenProps {
  progress?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress = 0 }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#111',
      color: '#fff',
      fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16, color: '#ffdd00' }}>MARIO</div>
      <div style={{ fontSize: 18, marginBottom: 32, color: '#aaa' }}>Loading...</div>
      <div style={{
        width: 200,
        height: 20,
        background: '#333',
        borderRadius: 10,
        overflow: 'hidden',
        border: '2px solid #555',
      }}>
        <div style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: '#ffdd00',
          transition: 'width 0.2s',
        }} />
      </div>
    </div>
  );
};
