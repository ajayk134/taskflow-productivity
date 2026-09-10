import clsx from 'clsx';

export default function EmptyState({ icon: Icon, title, description, action, actionLabel, onAction, className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 px-4', className)}>
      {Icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-5">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">{description}</p>
      )}
      {(action || onAction) && (
        <button onClick={onAction || action} className="btn-primary btn-sm">
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  );
}
