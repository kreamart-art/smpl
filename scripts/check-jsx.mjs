// Every <Component> used in a .jsx file must be imported or defined in it. A
// missing one still builds but white-screens at runtime.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src')
const files = []
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = path.join(d, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (p.endsWith('.jsx')) files.push(p)
  }
}
walk(root)

let problems = 0
for (const file of files) {
  const src = readFileSync(file, 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  const known = new Set()
  for (const m of src.matchAll(/import\s+([\s\S]*?)\s+from\s+['"]/g)) {
    for (const id of m[1].replace(/[{}*]/g, ' ').split(/[\s,]+/)) {
      if (id && id !== 'as') known.add(id)
    }
  }
  for (const m of src.matchAll(/(?:function|const|let|class)\s+([A-Z]\w*)/g)) known.add(m[1])
  for (const m of src.matchAll(/\{\s*([^}]*?)\s*\}\s*=\s*/g)) for (const id of m[1].split(/[\s,:]+/)) known.add(id)
  // destructured props / params that are rendered as components, e.g. ({ as: Tag })
  for (const m of src.matchAll(/as:\s*([A-Z]\w*)/g)) known.add(m[1])
  const used = new Set([...src.matchAll(/<([A-Z][\w]*)[\s/>.]/g)].map((m) => m[1]))
  for (const tag of used) {
    if (!known.has(tag)) {
      problems++
      console.log(`${path.relative(root, file)}: <${tag}> is not imported or defined`)
    }
  }
}
console.log(problems ? `${problems} problem(s)` : `ok: ${files.length} files`)
process.exit(problems ? 1 : 0)
