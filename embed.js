(function () {
  var scriptTag = document.currentScript;
  var quizOrigin = new URL(scriptTag.src).origin;
  var containerId = scriptTag.getAttribute('data-target') || 'fsb-eligibility-quiz';
  var container = document.getElementById(containerId);
  if (!container) return;

  // ponytail: on tablet/desktop the host gives the container a real height (e.g. matching a
  // neighboring video), so the iframe can just fill it. On mobile the container is a plain
  // stacked block with no defined height, so we fall back to the JS-measured pixel height from
  // the 'message' listener below (a plain height:100% there can't resolve to anything useful).
  var style = document.createElement('style');
  style.textContent = '@media (min-width: 768px) { .fsb-eligibility-quiz-iframe { height: 100% !important; } }';
  document.head.appendChild(style);

  var iframe = document.createElement('iframe');
  // ponytail: forward the landing page's query string (FB ad params, UTMs) into the quiz iframe as-is.
  iframe.src = quizOrigin + '/' + window.location.search;
  iframe.title = 'Home loan eligibility quiz';
  iframe.className = 'fsb-eligibility-quiz-iframe';
  iframe.style.width = '100%';
  iframe.style.border = 'none';
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
