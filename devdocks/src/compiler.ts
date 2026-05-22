import { Project } from './types';
import ts from 'typescript';

/**
 * Normalizes relative path imports into root-based absolute paths.
 * E.g. in "src/main.tsx": "./App" -> "/src/App"
 */
export function normalizeDraftImports(code: string, currentPath: string): string {
  // Resolve relative file path:
  const resolveRelative = (rel: string) => {
    if (!rel.startsWith('.')) return rel; // It's an external library package
    
    const parts = currentPath.split('/');
    parts.pop(); // Remove target script filename
    
    const relParts = rel.split('/');
    for (const part of relParts) {
      if (part === '.') {
        continue;
      } else if (part === '..') {
        parts.pop();
      } else {
        parts.push(part);
      }
    }
    
    return '/' + parts.filter(Boolean).join('/');
  };

  let result = code;

  // 1. Match standard imports:
  // import x from './y'
  result = result.replace(
    /(import\s+[\s\S]+?\s+from\s+['"])([^'"]+)(['"])/g,
    (match, prefix, relPath, suffix) => {
      if (relPath.startsWith('.')) {
        return `${prefix}${resolveRelative(relPath)}${suffix}`;
      }
      return match;
    }
  );

  // 2. Match standard styles / side-effect imports:
  // import './styles.css'
  result = result.replace(
    /(import\s+['"])([^'"]+)(['"])/g,
    (match, prefix, relPath, suffix) => {
      if (relPath.startsWith('.')) {
        return `${prefix}${resolveRelative(relPath)}${suffix}`;
      }
      return match;
    }
  );

  // 3. Match exports:
  // export { default } from './App'
  result = result.replace(
    /(export\s+[\s\S]+?\s+from\s+['"])([^'"]+)(['"])/g,
    (match, prefix, relPath, suffix) => {
      if (relPath.startsWith('.')) {
        return `${prefix}${resolveRelative(relPath)}${suffix}`;
      }
      return match;
    }
  );

  return result;
}

function resolveImportCandidate(specifier: string, currentPath: string): string {
  if (!specifier.startsWith('.')) return specifier;

  const parts = currentPath.split('/');
  parts.pop();

  specifier.split('/').forEach((part) => {
    if (part === '.' || !part) return;
    if (part === '..') parts.pop();
    else parts.push(part);
  });

  return '/' + parts.filter(Boolean).join('/');
}

function toSandboxSpecifier(absolutePath: string): string {
  return `#devdocks${absolutePath}`;
}

function resolveSandboxImport(specifier: string, currentPath: string, availableSpecifiers: Set<string>): string {
  if (!specifier.startsWith('.')) return specifier;

  const absolute = resolveImportCandidate(specifier, currentPath);
  const candidates = [
    absolute,
    `${absolute}.tsx`,
    `${absolute}.ts`,
    `${absolute}.jsx`,
    `${absolute}.js`,
    `${absolute}.css`,
    `${absolute}.json`,
    `${absolute}/index.tsx`,
    `${absolute}/index.ts`,
    `${absolute}/index.jsx`,
    `${absolute}/index.js`
  ];
  const match = candidates.find((candidate) => availableSpecifiers.has(candidate));
  return match ? toSandboxSpecifier(match) : specifier;
}

function rewriteLocalImportsToSandboxSpecifiers(code: string, currentPath: string, availableSpecifiers: Set<string>): string {
  let result = code;

  result = result.replace(
    /(import\s+[\s\S]+?\s+from\s+['"])([^'"]+)(['"])/g,
    (match, prefix, specifier, suffix) => `${prefix}${resolveSandboxImport(specifier, currentPath, availableSpecifiers)}${suffix}`
  );

  result = result.replace(
    /(import\s+['"])([^'"]+)(['"])/g,
    (match, prefix, specifier, suffix) => `${prefix}${resolveSandboxImport(specifier, currentPath, availableSpecifiers)}${suffix}`
  );

  result = result.replace(
    /(export\s+[\s\S]+?\s+from\s+['"])([^'"]+)(['"])/g,
    (match, prefix, specifier, suffix) => `${prefix}${resolveSandboxImport(specifier, currentPath, availableSpecifiers)}${suffix}`
  );

  return result;
}

function normalizeDependencyVersion(version: string | undefined): string {
  if (!version || version === 'latest') return 'latest';
  return version.replace(/^[\^~>=<\s]+/, '').trim() || 'latest';
}

function getPackageBaseName(specifier: string): string {
  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/');
  }

  return specifier.split('/')[0];
}

function readPackageDependencies(project: Project): Record<string, string> {
  const dependencies: Record<string, string> = {};

  project.installedPackages.forEach((pkg) => {
    dependencies[getPackageBaseName(pkg)] = 'latest';
  });

  const packageJson = project.files['package.json'];
  if (!packageJson?.content) return dependencies;

  try {
    const parsed = JSON.parse(packageJson.content);
    Object.assign(dependencies, parsed.dependencies || {}, parsed.devDependencies || {});
  } catch (err) {
    console.warn('DevDocks could not parse package.json dependencies', err);
  }

  return dependencies;
}

function createVirtualModule(content: string, blobUrlsToRevoke: string[]): string {
  const blob = new Blob([content], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  blobUrlsToRevoke.push(url);
  return url;
}

function registerImport(importsMap: Record<string, string>, specifier: string, url: string) {
  importsMap[specifier] = url;
  if (!specifier.startsWith('node:')) {
    importsMap[`node:${specifier}`] = url;
  }
}

function registerNodePolyfills(importsMap: Record<string, string>, blobUrlsToRevoke: string[], project: Project) {
  const fileSnapshot = Object.fromEntries(
    Object.entries(project.files)
      .filter(([, file]) => !file.isFolder)
      .map(([path, file]) => [`/${path.replace(/^\/+/, '')}`, file.content])
  );

  const processUrl = createVirtualModule(`
    export const env = {};
    export const browser = true;
    export const version = 'v22.0.0-devdocks-browser';
    export const versions = { node: '22.0.0-devdocks-browser' };
    export const platform = 'browser';
    export const argv = ['/usr/local/bin/node', '/workspace'];
    export const cwd = () => '/workspace';
    export const nextTick = (callback, ...args) => Promise.resolve().then(() => callback(...args));
    export const uptime = () => performance.now() / 1000;
    const processShim = { env, browser, version, versions, platform, argv, cwd, nextTick, uptime };
    globalThis.process = globalThis.process || processShim;
    export default processShim;
  `, blobUrlsToRevoke);

  const bufferUrl = createVirtualModule(`
    export class Buffer extends Uint8Array {
      static from(value = '', encoding = 'utf-8') {
        if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return new Buffer(value);
        return new Buffer(new TextEncoder().encode(String(value)));
      }
      static isBuffer(value) { return value instanceof Buffer; }
      toString() { return new TextDecoder().decode(this); }
    }
    globalThis.Buffer = globalThis.Buffer || Buffer;
    export default { Buffer };
  `, blobUrlsToRevoke);

  const pathUrl = createVirtualModule(`
    const clean = (value = '') => String(value).replace(/\\\\/g, '/');
    export const sep = '/';
    export const delimiter = ':';
    export function normalize(input = '.') {
      const isAbs = clean(input).startsWith('/');
      const parts = clean(input).split('/').filter(Boolean);
      const stack = [];
      for (const part of parts) {
        if (part === '.') continue;
        if (part === '..') stack.pop();
        else stack.push(part);
      }
      return (isAbs ? '/' : '') + stack.join('/') || '.';
    }
    export function join(...parts) { return normalize(parts.filter(Boolean).join('/')); }
    export function resolve(...parts) { return normalize('/' + parts.filter(Boolean).join('/')); }
    export function dirname(value = '') { const parts = clean(value).split('/'); parts.pop(); return parts.join('/') || '.'; }
    export function basename(value = '', ext = '') { const base = clean(value).split('/').pop() || ''; return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base; }
    export function extname(value = '') { const base = basename(value); const index = base.lastIndexOf('.'); return index > 0 ? base.slice(index) : ''; }
    export function isAbsolute(value = '') { return clean(value).startsWith('/'); }
    export const posix = { sep, delimiter, normalize, join, resolve, dirname, basename, extname, isAbsolute };
    export default { sep, delimiter, normalize, join, resolve, dirname, basename, extname, isAbsolute, posix };
  `, blobUrlsToRevoke);

  const fsUrl = createVirtualModule(`
    const files = ${JSON.stringify(fileSnapshot)};
    const storageKey = (path) => 'devdocks:fs:' + String(path).replace(/^\\/+/, '/');
    const normalize = (path) => {
      const clean = String(path || '/').replace(/\\\\/g, '/');
      return clean.startsWith('/') ? clean : '/' + clean;
    };
    const read = (path) => {
      const normalized = normalize(path);
      const stored = localStorage.getItem(storageKey(normalized));
      if (stored !== null) return stored;
      if (Object.prototype.hasOwnProperty.call(files, normalized)) return files[normalized];
      throw new Error('ENOENT: no such file or directory, open ' + normalized);
    };
    export function readFileSync(path, encoding = 'utf-8') { return read(path); }
    export function writeFileSync(path, data) { localStorage.setItem(storageKey(normalize(path)), String(data ?? '')); }
    export function appendFileSync(path, data) {
      const normalized = normalize(path);
      const current = existsSync(normalized) ? read(normalized) : '';
      localStorage.setItem(storageKey(normalized), current + String(data ?? ''));
    }
    export function existsSync(path) {
      const normalized = normalize(path);
      return localStorage.getItem(storageKey(normalized)) !== null || Object.prototype.hasOwnProperty.call(files, normalized);
    }
    export function readdirSync(path = '/') {
      const prefix = normalize(path).replace(/\\/$/, '') + '/';
      return Array.from(new Set(Object.keys(files).filter((file) => file.startsWith(prefix)).map((file) => file.slice(prefix.length).split('/')[0]).filter(Boolean)));
    }
    export function statSync(path) {
      const normalized = normalize(path);
      return {
        isFile: () => existsSync(normalized),
        isDirectory: () => readdirSync(normalized).length > 0,
        size: existsSync(normalized) ? read(normalized).length : 0
      };
    }
    export const promises = {
      readFile: async (...args) => readFileSync(...args),
      writeFile: async (...args) => writeFileSync(...args),
      appendFile: async (...args) => appendFileSync(...args),
      readdir: async (...args) => readdirSync(...args),
      stat: async (...args) => statSync(...args)
    };
    export default { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, statSync, promises };
  `, blobUrlsToRevoke);

  const eventsUrl = createVirtualModule(`
    export class EventEmitter {
      constructor() { this.events = new Map(); }
      on(name, listener) { const list = this.events.get(name) || []; list.push(listener); this.events.set(name, list); return this; }
      once(name, listener) { const wrapped = (...args) => { this.off(name, wrapped); listener(...args); }; return this.on(name, wrapped); }
      off(name, listener) { this.events.set(name, (this.events.get(name) || []).filter((item) => item !== listener)); return this; }
      removeListener(name, listener) { return this.off(name, listener); }
      emit(name, ...args) { (this.events.get(name) || []).forEach((listener) => listener(...args)); return true; }
    }
    export default { EventEmitter };
  `, blobUrlsToRevoke);

  const utilUrl = createVirtualModule(`
    export function promisify(fn) { return (...args) => new Promise((resolve, reject) => fn(...args, (error, value) => error ? reject(error) : resolve(value))); }
    export function inspect(value) { try { return JSON.stringify(value, null, 2); } catch { return String(value); } }
    export default { promisify, inspect };
  `, blobUrlsToRevoke);

  const cryptoUrl = createVirtualModule(`
    export function randomUUID() { return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2); }
    export function randomBytes(size = 16) { const bytes = new Uint8Array(size); crypto.getRandomValues(bytes); return bytes; }
    export function createHash() {
      let text = '';
      return { update(value) { text += String(value); return this; }, digest(format) { const value = btoa(unescape(encodeURIComponent(text))).replace(/=+$/, ''); return format === 'hex' ? Array.from(value).map((char) => char.charCodeAt(0).toString(16).padStart(2, '0')).join('') : value; } };
    }
    export default { randomUUID, randomBytes, createHash };
  `, blobUrlsToRevoke);

  const osUrl = createVirtualModule(`
    export const platform = () => 'browser';
    export const homedir = () => '/home/devdocks';
    export const tmpdir = () => '/tmp';
    export const type = () => 'Browser';
    export const release = () => navigator.userAgent;
    export default { platform, homedir, tmpdir, type, release };
  `, blobUrlsToRevoke);

  const httpUrl = createVirtualModule(`
    export function createServer(handler) {
      return {
        listen(port = 3000, callback) {
          console.log('[DevDocks Node shim] HTTP server listening virtually on localhost:' + port);
          if (callback) callback();
          return this;
        },
        close(callback) { if (callback) callback(); }
      };
    }
    export function request() { throw new Error('DevDocks browser sandbox does not open raw TCP sockets. Use fetch() for HTTP requests.'); }
    export const get = request;
    export default { createServer, request, get };
  `, blobUrlsToRevoke);

  const expressUrl = createVirtualModule(`
    function createApp() {
      const routes = [];
      const app = {
        routes,
        use(...args) { routes.push({ method: 'USE', path: typeof args[0] === 'string' ? args[0] : '/', handler: args.at(-1) }); return app; },
        get(path, handler) { routes.push({ method: 'GET', path, handler }); return app; },
        post(path, handler) { routes.push({ method: 'POST', path, handler }); return app; },
        put(path, handler) { routes.push({ method: 'PUT', path, handler }); return app; },
        delete(path, handler) { routes.push({ method: 'DELETE', path, handler }); return app; },
        listen(port = 3000, callback) {
          console.log('[DevDocks Express shim] Server routes are registered virtually on localhost:' + port);
          console.table(routes.map(({ method, path }) => ({ method, path })));
          if (callback) callback();
          return { close(closeCallback) { if (closeCallback) closeCallback(); } };
        }
      };
      return app;
    }
    createApp.json = () => (_req, _res, next) => next && next();
    createApp.urlencoded = () => (_req, _res, next) => next && next();
    createApp.static = () => (_req, _res, next) => next && next();
    export default createApp;
  `, blobUrlsToRevoke);

  const streamUrl = createVirtualModule(`
    import { EventEmitter } from 'events';
    export class Readable extends EventEmitter {}
    export class Writable extends EventEmitter {}
    export class Transform extends EventEmitter {}
    export default { Readable, Writable, Transform };
  `, blobUrlsToRevoke);

  const urlUrl = createVirtualModule(`
    export const URL = globalThis.URL;
    export const URLSearchParams = globalThis.URLSearchParams;
    export function fileURLToPath(value) { return String(value).replace(/^file:\\/\\//, ''); }
    export function pathToFileURL(value) { return new globalThis.URL('file://' + value); }
    export default { URL, URLSearchParams, fileURLToPath, pathToFileURL };
  `, blobUrlsToRevoke);

  registerImport(importsMap, 'process', processUrl);
  registerImport(importsMap, 'buffer', bufferUrl);
  registerImport(importsMap, 'path', pathUrl);
  registerImport(importsMap, 'fs', fsUrl);
  registerImport(importsMap, 'events', eventsUrl);
  registerImport(importsMap, 'util', utilUrl);
  registerImport(importsMap, 'crypto', cryptoUrl);
  registerImport(importsMap, 'os', osUrl);
  registerImport(importsMap, 'http', httpUrl);
  registerImport(importsMap, 'https', httpUrl);
  registerImport(importsMap, 'stream', streamUrl);
  registerImport(importsMap, 'url', urlUrl);
  importsMap.express = expressUrl;
}

function stripTypeScriptOnlySyntaxFromJavaScript(code: string): string {
  return code.replace(/([A-Za-z0-9_$\]\)])!([\.\[;,\)\r\n])/g, '$1$2');
}

function shouldParseJavaScriptAsJsx(filepath: string, code: string): boolean {
  if (filepath.endsWith('.jsx') || filepath.endsWith('.tsx')) return true;
  if (!filepath.endsWith('.js')) return false;

  return /<[A-Z][A-Za-z0-9]*(\s|>|\/>)/.test(code) || /<([a-z]+)(\s[^>]*)?>[\s\S]*<\/\1>/.test(code);
}

/**
 * Transpiles JSX/TSX/TS files to JavaScript in the browser.
 */
export function transpileCode(code: string, filepath: string): string {
  const isJS = filepath.endsWith('.js') || filepath.endsWith('.jsx');
  const isTS = filepath.endsWith('.ts') || filepath.endsWith('.tsx');

  if (!isJS && !isTS) return code;

  try {
    const source = isJS ? stripTypeScriptOnlySyntaxFromJavaScript(code) : code;
    const compilerFilepath = shouldParseJavaScriptAsJsx(filepath, source)
      ? filepath.replace(/\.js$/, '.jsx')
      : filepath;
    const result = ts.transpileModule(source, {
      fileName: compilerFilepath,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        jsxImportSource: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        isolatedModules: true
      },
      reportDiagnostics: true
    });

    const blockingDiagnostic = result.diagnostics?.find((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    if (blockingDiagnostic) {
      const message = ts.flattenDiagnosticMessageText(blockingDiagnostic.messageText, '\n');
      throw new Error(message);
    }

    return result.outputText;
  } catch (err: any) {
    throw new Error(`Compile Error in "${filepath}": ${err.message}`);
  }
}

export interface CompilationResult {
  html: string;
  blobUrls: string[];
  error: string | null;
}

/**
 * Compiles a project into a self-contained sandboxed environment.
 */
export function compileWorkspaceSandbox(
  project: Project,
  drafts: Record<string, string>
): CompilationResult {
  const blobUrlsToRevoke: string[] = [];
  const mapEntries: Record<string, string> = {};

  try {
    // 1. Gather files and merge with unsaved changes drafts
    const files = { ...project.files };
    
    // 2. Transpile all JS/TS/CSS code.
    const compiledFiles: Record<string, { content: string; type: string }> = {};

    for (const [path, file] of Object.entries(files)) {
      if (file.isFolder) continue;

      let content = drafts[path] !== undefined ? drafts[path] : file.content;
      let type = 'application/javascript';

      if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
        content = transpileCode(content, path);
      } else if (path.endsWith('.css')) {
        // Build style-injection code for active module resolution
        content = `
          const css = ${JSON.stringify(content)};
          const style = document.createElement('style');
          style.innerHTML = css;
          document.head.appendChild(style);
          export default {};
        `;
      } else if (path.endsWith('.json')) {
        // Dynamic JSON module loader
        content = `export default JSON.parse(${JSON.stringify(content)});`;
      } else {
        // Default static copy
        type = 'text/plain';
      }

      compiledFiles[path] = { content, type };
    }

    const availableSpecifiers = new Set<string>();
    Object.keys(compiledFiles).forEach((path) => {
      const absolutePath = path.startsWith('/') ? path : '/' + path;
      availableSpecifiers.add(absolutePath);
      const lastDot = absolutePath.lastIndexOf('.');
      if (lastDot > 0) {
        availableSpecifiers.add(absolutePath.substring(0, lastDot));
      }
    });

    Object.entries(compiledFiles).forEach(([path, file]) => {
      if (file.type === 'application/javascript') {
        file.content = rewriteLocalImportsToSandboxSpecifiers(file.content, path, availableSpecifiers);
      }
    });

    // 3. Create blob urls for each file after local import rewrites.
    for (const [path, file] of Object.entries(compiledFiles)) {
      const blob = new Blob([file.content], { type: file.type });
      const url = URL.createObjectURL(blob);
      blobUrlsToRevoke.push(url);

      const absolutePath = path.startsWith('/') ? path : '/' + path;
      mapEntries[absolutePath] = url;
      mapEntries[toSandboxSpecifier(absolutePath)] = url;

      // Duplicate entries without extensions to prevent resolve crashes (e.g. "./App" instead of "./App.tsx")
      const lastDot = absolutePath.lastIndexOf('.');
      if (lastDot > 0) {
        const withoutExt = absolutePath.substring(0, lastDot);
        mapEntries[withoutExt] = url;
        mapEntries[toSandboxSpecifier(withoutExt)] = url;
      }
    }

    // 4. Construct ESM import map using dynamic remote registry redirects
    const importsMap: Record<string, string> = {
      "react": "https://esm.sh/react@19.0.1?dev",
      "react/jsx-runtime": "https://esm.sh/react@19.0.1/jsx-runtime?dev",
      "react/jsx-dev-runtime": "https://esm.sh/react@19.0.1/jsx-dev-runtime?dev",
      "react-dom": "https://esm.sh/react-dom@19.0.1?dev&deps=react@19.0.1",
      "react-dom/client": "https://esm.sh/react-dom@19.0.1/client?dev&deps=react@19.0.1",
      "motion/react": "https://esm.sh/motion@12.23.24/react?deps=react@19.0.1",
      "framer-motion": "https://esm.sh/framer-motion@11.0.0?deps=react@19.0.1,react-dom@19.0.1",
      "zustand": "https://esm.sh/zustand@4.5.2?deps=react@19.0.1",
      "axios": "https://esm.sh/axios@1.6.8",
      "react-router-dom": "https://esm.sh/react-router-dom@6.22.3?deps=react@19.0.1,react-dom@19.0.1",
      "lucide-react": "https://esm.sh/lucide-react@0.354.0?deps=react@19.0.1",
    };

    registerNodePolyfills(importsMap, blobUrlsToRevoke, project);

    const dependencies = readPackageDependencies(project);
    Object.entries(dependencies).forEach(([packageName, version]) => {
      if (importsMap[packageName]) return;

      const cleanVersion = normalizeDependencyVersion(version);
      const versionedPackage = cleanVersion === 'latest' ? packageName : `${packageName}@${cleanVersion}`;
      importsMap[packageName] = `https://esm.sh/${versionedPackage}?bundle&target=es2020&browser&deps=react@19.0.1,react-dom@19.0.1`;
      importsMap[`${packageName}/`] = `https://esm.sh/${versionedPackage}/`;
    });

    // Overlay local mapped items in the imports map
    Object.entries(mapEntries).forEach(([absPath, url]) => {
      importsMap[absPath] = url;
      // Also map standard relative shorthands relative to index.html root, e.g. "./src/App" -> url
      importsMap['.' + absPath] = url;
    });

    // 5. Build dynamic sandboxed HTML wrapper frame
    const userIndexHtml = files['index.html']?.content || `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/></head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.tsx"></script>
        </body>
      </html>
    `;

    // Overwrite script references and place the Import Map in head
    const importMapScript = `
      <!-- DevDocks Sandbox Runtime Header -->
      <script type="importmap">
        {
          "imports": ${JSON.stringify(importsMap, null, 2)}
        }
      </script>
      
      <!-- Safe runtime error catcher -->
      <script>
        window.addEventListener('error', (event) => {
          window.parent.postMessage({
            type: 'SANDBOX_RUNTIME_ERROR',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }, '*');
        });
        
        // Console interceptor logs
        const _log = console.log;
        const _error = console.error;
        console.log = (...args) => {
          _log(...args);
          window.parent.postMessage({
            type: 'SANDBOX_CONSOLE',
            level: 'log',
            content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
          }, '*');
        };
        console.error = (...args) => {
          _error(...args);
          window.parent.postMessage({
            type: 'SANDBOX_CONSOLE',
            level: 'error',
            content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
          }, '*');
        };
      </script>
    `;

    // Inject our Import Map and Error Catch scripts right after <head> opens or at top
    let finalHtml = userIndexHtml;
    if (finalHtml.includes('<head>')) {
      finalHtml = finalHtml.replace('<head>', `<head>${importMapScript}`);
    } else {
      finalHtml = importMapScript + finalHtml;
    }

    // Replace the main.tsx entry point script with its mapped blob URL if script source loads relative to workspace
    // E.g. </body > ... <script src="/src/main.tsx"> -> source mapped url
    const mainPath = Object.keys(mapEntries).find(key => key.endsWith('main') || key.endsWith('main.tsx'));
    if (mainPath && mapEntries[mainPath]) {
      const targetBlob = mapEntries[mainPath];
      // Regex replace to swap static references with raw blobUrls
      finalHtml = finalHtml.replace(/src="\/src\/main\.[t|j]sx?"/g, `src="${targetBlob}"`);
      finalHtml = finalHtml.replace(/src="\.\/src\/main\.[t|j]sx?"/g, `src="${targetBlob}"`);
    }

    return {
      html: finalHtml,
      blobUrls: blobUrlsToRevoke,
      error: null,
    };
  } catch (err: any) {
    return {
      html: `
        <div style="background:#1e1e24; color:#ff6b6b; padding:1.5rem; font-family:monospace; border-radius:8px; border-left:4px solid #f00;">
          <h3 style="margin-top:0;">⚠️ Compilation Failed</h3>
          <p>${err.message}</p>
        </div>
      `,
      blobUrls: blobUrlsToRevoke,
      error: err.message,
    };
  }
}
