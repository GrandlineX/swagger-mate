import fs from 'fs';
import Path from 'path';

function copyDebugFile(...els) {
  for (const el of els) {
    fs.cpSync(
      Path.join('.','src', 'Swagger', 'debug', el),
      Path.join('.','res', 'templates', 'class', el)
    );
  }
}

copyDebugFile('BaseCon.ts', 'FetchCon.ts', 'NodeCon.ts');
