import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const svg = (size, padding) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect x="${padding}" y="${padding}" width="${512 - padding * 2}" height="${512 - padding * 2}" rx="${110 - padding / 2}" fill="#C4663E"/>
  <path d="M176 128h160a24 24 0 0 1 24 24v248l-104-72-104 72V152a24 24 0 0 1 24-24z" fill="#FBF6EF"/>
</svg>`

const targets = [
  { file: 'public/icons/icon-192.png', size: 192, padding: 0 },
  { file: 'public/icons/icon-512.png', size: 512, padding: 0 },
  { file: 'public/icons/icon-maskable-512.png', size: 512, padding: -40 },
  { file: 'public/apple-touch-icon.png', size: 180, padding: 0 },
  { file: 'public/favicon.png', size: 64, padding: 0 },
]

await mkdir('public/icons', { recursive: true })
for (const t of targets) {
  const png = await sharp(Buffer.from(svg(512, t.padding))).resize(t.size, t.size).png().toBuffer()
  await writeFile(t.file, png)
  console.log('wrote', t.file)
}
