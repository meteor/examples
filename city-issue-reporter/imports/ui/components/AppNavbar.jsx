import React from 'react';
import { Link, Navbar, NavLeft, NavRight } from 'framework7-react';

export default function AppNavbar({
  actionDisabled,
  actionLabel,
  actionText,
  backLabel,
  onAction,
  onBack,
  onOpenNavigation,
  title,
}) {
  return (
    <Navbar title={title}>
      <NavLeft>
        {onBack ? (
          <Link
            href="#"
            className="navbar-back-link"
            aria-label={backLabel || 'Back'}
            onClick={(event) => {
              event.preventDefault();
              onBack();
            }}
          >
            <span className="back-glyph" aria-hidden="true">‹</span>
            <span className="back-label">{backLabel || 'Back'}</span>
          </Link>
        ) : (
          <Link
            href="#"
            className="navbar-menu-link"
            aria-label="Open navigation"
            onClick={(event) => {
              event.preventDefault();
              onOpenNavigation();
            }}
          >
            <span className="menu-glyph" aria-hidden="true">☰</span>
          </Link>
        )}
      </NavLeft>
      {onAction && (
        <NavRight>
          <Link
            href="#"
            className="navbar-action-link"
            aria-label={actionLabel}
            aria-disabled={actionDisabled || undefined}
            disabled={actionDisabled}
            role="button"
            onClick={(event) => {
              event.preventDefault();
              if (actionDisabled) return;
              onAction();
            }}
          >
            {actionText}
          </Link>
        </NavRight>
      )}
    </Navbar>
  );
}
