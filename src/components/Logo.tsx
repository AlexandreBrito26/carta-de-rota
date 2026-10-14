// Marca: rosa dos ventos com agulha bicolor que oscila devagar
export default function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Carta de Rota">
      <circle className="logo__ring" cx="24" cy="24" r="22.5" />
      <circle className="logo__inner" cx="24" cy="24" r="16" />
      {[0, 90, 180, 270].map((deg) => (
        <line key={deg} className="logo__tick" x1="24" y1="4.5" x2="24" y2="8" transform={`rotate(${deg} 24 24)`} />
      ))}
      <g className="logo__needle">
        <polygon className="logo__north" points="24,9 28,24 20,24" />
        <polygon className="logo__south" points="24,39 28,24 20,24" />
      </g>
      <circle className="logo__pin" cx="24" cy="24" r="2.6" />
    </svg>
  );
}
