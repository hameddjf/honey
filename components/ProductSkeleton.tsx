export default function ProductSkeleton() {
  return (
    <div className="p-card p-skeleton">
      <div className="p-media skeleton-block" />
      <div className="p-body">
        <div className="skeleton-line skeleton-line--sm" />
        <div className="skeleton-line skeleton-line--lg" />
        <div className="skeleton-line skeleton-line--md" />
        <div className="skeleton-line skeleton-line--md" style={{ width: "70%" }} />
        <div className="p-foot" style={{ marginTop: 18 }}>
          <div className="skeleton-line skeleton-line--sm" style={{ width: 90 }} />
          <div className="skeleton-circle" />
        </div>
      </div>
    </div>
  );
}
