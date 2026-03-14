export function Card({ children, className }) {
  return <div className={`border rounded-lg p-4 shadow ${className}`}>{children}</div>;
}

export function CardContent({ children }) {
  return <div>{children}</div>;
}
