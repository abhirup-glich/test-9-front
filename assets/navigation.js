document.addEventListener('DOMContentLoaded', function () {
  var CURRENT_PORT = window.location.port;
  var HOST = window.location.hostname || 'localhost';
  var PATHS_ADMIN = [
    '/WebPage/Admin Page/serveradmin.html',
    '/WebPage/Admin Page/admin.html',
    '/serveradmin',
    '/admin',
    '/admin.html',
    '/serveradmin.html'
  ];
  function isAdminPagePath(pathname) {
    return PATHS_ADMIN.some(function (p) {
      return decodeURI(pathname).toLowerCase().endsWith(p.toLowerCase());
    });
  }
  function buildAbsolute(path, port) {
    var origin = window.location.protocol + '//' + HOST + (CURRENT_PORT ? ':' + CURRENT_PORT : '');
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return origin + path;
    var base = '/WebPage/';
    if (path.indexOf('/WebPage/') === 0) base = '';
    return origin + base + path;
  }
  function showToast(msg) {
    var t = document.getElementById('fastToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'fastToast';
      t.className = 'fast-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('active');
    setTimeout(function () { t.classList.remove('active'); }, 3000);
  }
  document.body.classList.add('fast-page', 'fast-enter');
  var loader = document.getElementById('pageLoader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.setAttribute('aria-hidden', 'true');
    var sp = document.createElement('div');
    sp.className = 'spinner';
    sp.setAttribute('role', 'status');
    sp.setAttribute('aria-live', 'polite');
    sp.setAttribute('aria-label', 'Loading');
    loader.appendChild(sp);
    document.body.appendChild(loader);
  }
  function ping(url) {
    return new Promise(function (resolve, reject) {
      var timedOut = false;
      var to = setTimeout(function () { timedOut = true; reject(new Error('Timeout')); }, 1500);
      fetch(url, { mode: 'no-cors' }).then(function () {
        if (timedOut) return;
        clearTimeout(to);
        resolve(true);
      }).catch(function (e) {
        clearTimeout(to);
        reject(e);
      });
    });
  }
  function navigateTo(url) {
    if (!url) return;
    document.body.classList.remove('fast-enter');
    document.body.classList.add('fast-exit');
    loader.classList.add('active');
    setTimeout(function () { window.location.href = url; }, 50);
  }
  Array.prototype.forEach.call(document.querySelectorAll('nav'), function (nav) {
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Primary');
  });
  var logo = document.querySelector('.fast-logo');
  if (logo) {
    var home = buildAbsolute('index.html', PORTS.app);
    logo.setAttribute('href', home);
    logo.setAttribute('aria-label', 'Go to F.A.S.T. Home');
    logo.addEventListener('click', function (e) {
      e.preventDefault();
      var dest = home + (window.location.search || '') + (window.location.hash || '');
      navigateTo(dest);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('a'), function (a) {
    var text = (a.textContent || '').trim().toLowerCase();
    if (text === 'privacy policy') {
      a.setAttribute('href', buildAbsolute('PrivacyPolicy.html', PORTS.app));
    } else if (text === 'terms of service') {
      a.setAttribute('href', buildAbsolute('TermsOfService.html', PORTS.app));
    } else if (text === 'logout') {
      a.setAttribute('href', buildAbsolute('Loginv2/index.html', PORTS.app));
      a.setAttribute('role', 'button');
      a.addEventListener('click', function (e) {
        e.preventDefault();
        navigateTo(a.getAttribute('href'));
      });
    }
    if (a.getAttribute('href') && /\.html?$/.test(a.getAttribute('href'))) {
      a.addEventListener('click', function (e) {
        if (a.target && a.target.toLowerCase() === '_blank') return;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;
        e.preventDefault();
        navigateTo(href);
      });
    }
  });
  Array.prototype.forEach.call(document.querySelectorAll('button, [role="button"], .btn'), function (el) {
    el.setAttribute('aria-pressed', 'false');
    el.addEventListener('mousedown', function () { el.setAttribute('aria-pressed', 'true'); });
    el.addEventListener('mouseup', function () { el.setAttribute('aria-pressed', 'false'); });
  });
  // Single-port setup: do not auto-redirect across ports
});
