(function () {
  var scriptTag = document.currentScript;
  var quizOrigin = new URL(scriptTag.src).origin;
  var containerId = scriptTag.getAttribute('data-target') || 'fsb-eligibility-quiz';
  var container = document.getElementById(containerId);
  if (!container) return;

  var iframe = document.createElement('iframe');
  iframe.src = quizOrigin + '/';
  iframe.title = 'Home loan eligibility quiz';
  iframe.loading = 'lazy';
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.minHeight = '520px';
  container.appendChild(iframe);

  window.addEventListener('message', function (event) {
    if (event.origin !== quizOrigin) return;
    if (event.data && event.data.source === 'eligibility-quiz' && event.data.height) {
      iframe.style.height = event.data.height + 'px';
    }
  });
})();
