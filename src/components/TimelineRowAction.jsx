function TimelineRowAction({ icon, label, title = label, ...buttonProps }) {
  return (
    <button
      type="button"
      className="timeline__row-action"
      onPointerDown={event => event.stopPropagation()}
      title={title}
      aria-label={label}
      {...buttonProps}
    >
      {icon}
    </button>
  )
}

export default TimelineRowAction
