(() => {
  const base = new URL('../..', document.currentScript.src);
  const defaults = window.SITE_BRAND;
  const template = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
  const handle = url => { try { return new URL(url).pathname.replace(/^\/+|\/+$/g, ''); } catch { return ''; } };
  const btnTextFor = hex => {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
    if (!m) return '#081426';
    const [r, g, b] = [m[1], m[2], m[3]].map(v => {
      const c = parseInt(v, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 0.22 ? '#081426' : '#ffffff';
  };
  function apply(config) {
    const values = { ...config, fullName: config.name + ' ' + config.descriptor, cta: 'Hablar con ' + config.name };
    const digits = config.phone.replace(/\D/g, '');
    const localDigits = (digits.length === 12 && digits.startsWith('52')) ? digits.slice(2) : digits;
    values.phoneDisplay = localDigits.length === 10 ? `${localDigits.slice(0, 3)} ${localDigits.slice(3, 6)} ${localDigits.slice(6)}` : config.phone;
    values.whatsapp = 'https://wa.me/' + digits + '?text=' + encodeURIComponent('Hola, me gustaría conocer los servicios de ' + values.fullName + '.');
    values.mail = 'mailto:' + config.email + '?subject=' + encodeURIComponent('Solicitud de información') + '&body=' + encodeURIComponent('Hola, equipo ' + config.name + '.\nMe gustaría recibir información sobre sus servicios.');
    values.instagramHandle = config.instagram ? '@' + handle(config.instagram) : '';
    values.tiktokHandle = config.tiktok ? handle(config.tiktok) : '';
    document.querySelectorAll('[data-brand]').forEach(el => { el.textContent = values[el.dataset.brand] ?? ''; });
    document.querySelectorAll('[data-brand-template]').forEach(el => { el.textContent = template(el.dataset.brandTemplate, values); });
    document.querySelectorAll('[data-brand-content]').forEach(el => { el.content = template(el.dataset.brandContent, values); });
    document.querySelectorAll('[data-brand-url]').forEach(el => { el.content = config.website.replace(/\/$/, '') + '/' + el.dataset.brandUrl; });
    document.querySelectorAll('[data-brand-aria]').forEach(el => { el.setAttribute('aria-label', template(el.dataset.brandAria, values)); });
    document.querySelectorAll('[data-brand-link]').forEach(el => {
      const link = values[el.dataset.brandLink];
      el.href = link || '#';
      el.hidden = !link;
    });
    document.querySelectorAll('[data-brand-image]').forEach(el => {
      el.src = config.icon.startsWith('data:') ? config.icon : new URL(config.icon, base).href;
      el.alt = values.fullName;
    });
    document.documentElement.style.setProperty('--accent', config.accent);
    document.documentElement.style.setProperty('--btn-text', btnTextFor(config.accent));
    document.querySelectorAll('.brand-wordmark').forEach(el => {
      el.style.fontSize = config.name.length > 15 ? '19px' : '28px';
    });
  }
  if (defaults) apply(defaults);
  window.addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'maper-preview') return;
    apply(event.data.config);
  });
})();
