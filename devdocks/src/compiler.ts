import { Project } from './types';

// Typings for window with Babel compiler
declare global {
  interface Window {
    Babel?: {
      transform: (
        code: string,
        options: {
          filename?: string;
          presets?: string[];
          plugins?: any[];
        }
      ) => { code: string };
    };
  }
}

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

/**
 * Transpiles JSX/TSX/TS files to JavaScript in the browser.
 */
export function transpileCode(code: string, filepath: string): string {
  const isJS = filepath.endsWith('.js') || filepath.endsWith('.jsx');
  const isTS = filepath.endsWith('.ts') || filepath.endsWith('.tsx');

  if (!isJS && !isTS) return code;

  if (!window.Babel) {
    // Elegant fallback if CDN script isn't fully loaded yet
    console.warn('DevDocks Babel Standalone not loaded yet.');
    // Let's strip TypeScript typings and basic JSX as fallback or throw error
  }

  const presets = ['react'];
  if (isTS) {
    presets.push('typescript');
  }

  try {
    const result = window.Babel!.transform(code, {
      filename: filepath,
      presets: presets,
    });
    return result.code;
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
    
    // 2. Normalize and transpile all JS/TS/CSS code 
    const compiledFiles: Record<string, { content: string; type: string }> = {};

    for (const [path, file] of Object.entries(files)) {
      if (file.isFolder) continue;

      let content = drafts[path] !== undefined ? drafts[path] : file.content;
      let type = 'application/javascript';

      // Normalize imports relative pathways 
      if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
        content = normalizeDraftImports(content, path);
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

    // 3. Create blob urls for each file
    for (const [path, file] of Object.entries(compiledFiles)) {
      const blob = new Blob([file.content], { type: file.type });
      const url = URL.createObjectURL(blob);
      blobUrlsToRevoke.push(url);

      const absolutePath = path.startsWith('/') ? path : '/' + path;
      mapEntries[absolutePath] = url;

      // Duplicate entries without extensions to prevent resolve crashes (e.g. "./App" instead of "./App.tsx")
      const lastDot = absolutePath.lastIndexOf('.');
      if (lastDot > 0) {
        const withoutExt = absolutePath.substring(0, lastDot);
        mapEntries[withoutExt] = url;
      }
    }

    // 4. Construct ESM import map using dynamic remote registry redirects
    const importsMap: Record<string, string> = {
      "react": "https://esm.sh/react@19?dev",
      "react-dom": "https://esm.sh/react-dom@19?dev",
      "react-dom/client": "https://esm.sh/react-dom@19/client?dev",
      "motion/react": "https://esm.sh/motion@12.23.24",
      "framer-motion": "https://esm.sh/framer-motion@11.0.0",
      "zustand": "https://esm.sh/zustand@4.5.2",
      "axios": "https://esm.sh/axios@1.6.8",
      "react-router-dom": "https://esm.sh/react-router-dom@6.22.3",
      "lucide-react": "https://esm.sh/lucide-react@0.354.0",
    };

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
