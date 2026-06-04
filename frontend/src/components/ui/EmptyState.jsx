export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="dash-empty">
      {Icon && (
        <div className="dash-empty__icon">
          <Icon size={28} strokeWidth={1.5} />
        </div>
      )}
      <p className="dash-empty__title">{title}</p>
      {description && <p className="dash-empty__desc">{description}</p>}
      {action}
    </div>
  );
}
