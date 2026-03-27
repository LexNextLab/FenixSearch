"use client";

interface ErrorAlertProps {
  message: string;
  code?: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ message, code, onDismiss }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-[#D5B170]/40 bg-[#D5B170]/10 px-4 py-3 text-[#D5B170]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {code && (
            <span className="text-xs font-mono uppercase tracking-wider opacity-80">
              {code}
            </span>
          )}
          <p className="mt-0.5 text-sm font-medium">{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded p-1 transition hover:bg-[#D5B170]/20"
            aria-label="Fechar"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
