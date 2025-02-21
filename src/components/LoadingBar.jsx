export function LoadingBar({ progress = 0, height = 2, color = 'var(--primary)' }) {
  return (
    <div 
      style={{ 
        width: '100%',
        height: `${height}px`,
        background: 'var(--muted-background)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${progress * 100}%`,
          background: color,
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  );
}
