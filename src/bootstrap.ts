import scopedCss from 'virtual:scoped-bootstrap'

/**
 * Where the widget's Bootstrap styles come from:
 * - 'auto': use the host page's Bootstrap 5.3 when it has one, bundled styles otherwise.
 * - 'host': never inject anything (the host has Bootstrap, or links
 *   deploy-map.bootstrap.css itself).
 * - 'bundled': always inject the bundled styles.
 */
export type BootstrapMode = 'auto' | 'host' | 'bundled'

const MARKER = 'data-deploy-map-bootstrap'

/** --bs-emphasis-color was added in Bootstrap 5.3, so older versions do not count. */
export function hostHasBootstrap(): boolean {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--bs-emphasis-color')
  return value.trim() !== ''
}

/** Inject the bundled styles if needed. They are scoped to the widget and added only once. */
export function ensureBootstrap(mode: BootstrapMode): void {
  if (mode === 'host' || (mode === 'auto' && hostHasBootstrap())) return
  if (document.head.querySelector(`style[${MARKER}]`)) return
  const style = document.createElement('style')
  style.setAttribute(MARKER, '')
  style.textContent = scopedCss
  document.head.append(style)
}
