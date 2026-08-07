(function () {
  var scriptTag = document.currentScript;
  var quizOrigin = new URL(scriptTag.src).origin;
  var containerId = scriptTag.getAttribute('data-target') || 'fsb-eligibility-quiz';
  var container = document.getElementById(containerId);
  if (!container) return;

  var iframe = document.createElement('iframe');
  // ponytail: forward the landing page's query string (FB ad params, UTMs) into the quiz iframe as-is.
  iframe.src = quizOrigin + '/' + window.location.search;
  iframe.title = 'Home loan eligibility quiz';
  iframe.loading = 'lazy';
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  // ponytail: placeholder only — the host container has no defined height, so a
  // percentage height here can't resolve and the iframe falls back to a tiny
  // default. The 'message' listener below sets the real pixel height once the
  // quiz reports its actual content height.
  iframe.style.height = '520px';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = 'rgba(149, 157, 165, 0.2) 0px 8px 24px;';
  container.appendChild(iframe);

  window.addEventListener('message', function (event) {
    if (event.origin !== quizOrigin) return;
    if (!event.data || event.data.source !== 'eligibility-quiz') return;
    if (event.data.height) {
      iframe.style.height = event.data.height + 'px';
    }
    if (event.data.redirect) {
      window.location.href = event.data.redirect;
    }
  });
})();
