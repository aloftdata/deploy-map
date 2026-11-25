// Runs every example from the code shown on the page, so the page cannot show
// one thing and run another.
for (const code of document.querySelectorAll('pre.runnable code')) {
  new Function(code.textContent)()
}
