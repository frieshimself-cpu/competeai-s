export function FormDots({ last5 }: { last5: number[] }) {
  if (!last5.length) return <span className="faint tiny">no results yet</span>;
  return (
    <span className="form-dots" title="Points from the last 5 scored matches">
      {last5.map((p, i) => (
        <span key={i} className={`form-dot p${p === 5 ? 5 : p === 3 ? 3 : p === 2 ? 2 : 0}`}>
          {p}
        </span>
      ))}
    </span>
  );
}
