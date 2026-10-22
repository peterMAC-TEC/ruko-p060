// A soft fade between pages (opacity only, so fixed overlays and layout are untouched). Reduced motion removes it.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="m-route flex min-h-0 flex-1 flex-col">{children}</div>;
}
