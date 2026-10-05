"""Editor local de identidad. Sólo sirve y guarda archivos de este sitio."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from html.parser import HTMLParser
from urllib.parse import urlparse, quote
import argparse
import base64
import html
import json
import re
import tempfile
import threading
import webbrowser

ROOT = Path(__file__).resolve().parents[1]
PAGES = ('index.html', 'contacto/index.html')
FIELDS = ('name', 'descriptor', 'email', 'phone', 'tagline', 'location', 'website',
          'instagram', 'facebook', 'tiktok', 'icon', 'accent')


def validate(value):
    if not isinstance(value, dict) or set(value) != set(FIELDS):
        raise ValueError('La configuración no contiene los campos esperados.')
    result = {}
    for key in FIELDS:
        if not isinstance(value[key], str):
            raise ValueError('Los datos deben ser texto.')
        result[key] = value[key].strip()
    for key in ('name', 'descriptor', 'tagline', 'location'):
        if not result[key] or len(result[key]) > 140:
            raise ValueError('Completa los textos de marca con un máximo de 140 caracteres.')
    if len(result['name']) > 36:
        raise ValueError('El nombre corto admite hasta 36 caracteres.')
    if not re.fullmatch(r'[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+', result['email']):
        raise ValueError('Escribe un correo válido.')
    if not 10 <= len(re.sub(r'\D', '', result['phone'])) <= 15:
        raise ValueError('Incluye la clave del país en el teléfono.')
    if not re.fullmatch(r'#[0-9a-fA-F]{6}', result['accent']):
        raise ValueError('Color no válido.')
    for key in ('website', 'instagram', 'facebook', 'tiktok'):
        u = urlparse(result[key])
        if result[key] and (u.scheme != 'https' or not u.netloc or u.username or u.password):
            raise ValueError('Los enlaces deben comenzar con https://.')
    icon = result['icon']
    if icon.startswith('data:image/'):
        if not re.match(r'^data:image/(png|jpeg|webp|svg\+xml);base64,', icon):
            raise ValueError('Formato de logo no válido.')
        try:
            raw = base64.b64decode(icon.split(',', 1)[1], validate=True)
        except Exception as exc:
            raise ValueError('El logo no se pudo leer.') from exc
        if len(raw) > 2 * 1024 * 1024:
            raise ValueError('El logo debe pesar menos de 2 MB.')
    else:
        candidate = (ROOT / icon).resolve()
        if not candidate.is_relative_to(ROOT / 'assets') or not candidate.is_file():
            raise ValueError('El logo debe estar en assets o ser una imagen cargada.')
    return result


def values(config, prefix=''):
    result = dict(config)
    result['fullName'] = config['name'] + ' ' + config['descriptor']
    result['cta'] = 'Hablar con ' + config['name']
    result['whatsapp'] = 'https://wa.me/' + re.sub(r'\D', '', config['phone']) + '?text=' + quote('Hola, me gustaría conocer los servicios de ' + result['fullName'] + '.')
    result['mail'] = 'mailto:' + config['email'] + '?subject=' + quote('Solicitud de información') + '&body=' + quote('Hola, equipo ' + config['name'] + '.\nMe gustaría recibir información sobre sus servicios.')
    result['icon'] = config['icon'] if config['icon'].startswith('data:') else prefix + config['icon']
    result['instagramHandle'] = '@' + urlparse(config['instagram']).path.strip('/') if config['instagram'] else ''
    result['tiktokHandle'] = urlparse(config['tiktok']).path.strip('/') if config['tiktok'] else ''
    return result


def substitute(template, vals):
    return re.sub(r'\{(\w+)\}', lambda m: vals.get(m[1], m[0]), template)


class Render(HTMLParser):
    def __init__(self, config, prefix):
        super().__init__(convert_charrefs=False)
        self.vals = values(config, prefix)
        self.config = config
        self.output = []
        self.suppressed = None

    def handle_starttag(self, tag, attrs):
        if self.suppressed:
            return
        attrs = dict(attrs)
        if 'data-brand-content' in attrs:
            attrs['content'] = substitute(attrs['data-brand-content'], self.vals)
        if 'data-brand-url' in attrs:
            suffix = attrs['data-brand-url']
            attrs['content'] = self.config['website'].rstrip('/') + '/' + suffix
        if 'data-brand-link' in attrs:
            attrs['href'] = self.vals[attrs['data-brand-link']]
        if 'data-brand-image' in attrs:
            attrs['src'] = self.vals[attrs['data-brand-image']]
            attrs['alt'] = self.vals['fullName']
        if 'data-brand-aria' in attrs:
            attrs['aria-label'] = substitute(attrs['data-brand-aria'], self.vals)
        self.output.append('<' + tag + ''.join(' ' + k + ('="' + html.escape(v, quote=True) + '"' if v is not None else '') for k, v in attrs.items()) + '>')
        if 'data-brand' in attrs or 'data-brand-template' in attrs:
            text = self.vals[attrs['data-brand']] if 'data-brand' in attrs else substitute(attrs['data-brand-template'], self.vals)
            self.output.append(html.escape(text))
            self.suppressed = tag

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if self.suppressed:
            if tag != self.suppressed:
                return
            self.suppressed = None
        self.output.append('</' + tag + '>')

    def handle_data(self, data):
        if not self.suppressed:
            self.output.append(data)

    def handle_decl(self, decl):
        self.output.append('<!' + decl + '>')

    def handle_comment(self, comment):
        if not self.suppressed:
            self.output.append('<!--' + comment + '-->')

    def handle_entityref(self, name):
        if not self.suppressed:
            self.output.append('&' + name + ';')

    def handle_charref(self, name):
        if not self.suppressed:
            self.output.append('&#' + name + ';')


def save(config):
    config = validate(config)
    rendered = {}
    for page in PAGES:
        parser = Render(config, '' if page == 'index.html' else '../')
        parser.feed((ROOT / page).read_text(encoding='utf-8'))
        rendered[page] = ''.join(parser.output)
    serialized = json.dumps(config, ensure_ascii=False, indent=2)
    rendered['marca.json'] = serialized + '\n'
    rendered['assets/js/marca-config.js'] = 'window.SITE_BRAND = ' + serialized.replace('<', '\\u003c') + ';\n'
    # Cada archivo se sustituye por una versión completa; no se truncan archivos al escribir.
    for name, text in rendered.items():
        path = ROOT / name
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent, delete=False) as file:
            file.write(text)
            temp = Path(file.name)
        temp.replace(path)
    return config


def load():
    return json.loads((ROOT / 'marca.json').read_text(encoding='utf-8'))


class EditorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def permitted(self):
        host = self.headers.get('Host', '')
        allowed = {'127.0.0.1:' + str(self.server.server_port), 'localhost:' + str(self.server.server_port)}
        return host in allowed and self.headers.get('Origin', 'http://' + host) in {'http://' + h for h in allowed}

    def reply(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not self.permitted():
            return self.reply(403, {'error': 'Acceso local únicamente.'})
        route = urlparse(self.path).path
        if route == '/api/marca':
            return self.reply(200, load())
        if any(part.startswith('.') for part in Path(route).parts):
            return self.reply(404, {'error': 'No disponible.'})
        super().do_GET()

    def do_POST(self):
        if not self.permitted() or self.path != '/api/marca':
            return self.reply(403, {'error': 'Acceso local únicamente.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 3 * 1024 * 1024:
                raise ValueError('Tamaño de solicitud no válido.')
            config = json.loads(self.rfile.read(length))
            with self.server.save_lock:
                save(config)
            self.reply(200, {'ok': True})
        except (ValueError, KeyError) as exc:
            self.reply(400, {'error': str(exc)})
        except OSError:
            self.reply(500, {'error': 'No se pudo guardar. Comprueba los permisos de esta carpeta.'})


def main():
    parser = argparse.ArgumentParser(description='Editor local del sitio MAPER')
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--build', action='store_true')
    args = parser.parse_args()
    if args.build:
        save(load())
        return
    server = ThreadingHTTPServer(('127.0.0.1', args.port), EditorHandler)
    server.save_lock = threading.Lock()
    url = 'http://127.0.0.1:' + str(server.server_port) + '/editar.html'
    print('Editor: ' + url, flush=True)
    print('Cierra esta ventana para terminar. Guardar modifica sólo esta copia local.', flush=True)
    if not args.no_browser:
        webbrowser.open(url)
    server.serve_forever()


if __name__ == '__main__':
    main()
