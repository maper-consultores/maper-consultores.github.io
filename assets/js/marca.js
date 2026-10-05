(() => {
  const base = new URL('../..', document.currentScript.src);
  const defaults = window.SITE_BRAND;
  const template = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
  const handle = url => { try { return new URL(url).pathname.replace(/^\/+|\/+$/g, ''); } catch { return ''; } };
  function apply(config) {
    const values = { ...config, fullName: config.name + ' ' + config.descriptor, cta: 'Hablar con ' + config.name };
    values.whatsapp = 'https://wa.me/' + config.phone.replace(/\D/g, '') + '?text=' + encodeURIComponent('Hola, me gustaría conocer los servicios de ' + values.fullName + '.');
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
    document.querySelectorAll('.brand-wordmark').forEach(el => {
      el.style.fontSize = config.name.length > 15 ? '19px' : '30px';
    });
  }
  if (defaults) apply(defaults);
  window.addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'maper-preview') return;
    apply(event.data.config);
  });
})();
