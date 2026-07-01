const sharp = require('sharp');
const path = require('path');

const origem = path.join(__dirname, '..', 'public', 'branding', 'logo-opcao-3-bomba-combustivel.svg');
const destino = (nome) => path.join(__dirname, '..', 'public', nome);

async function gerar() {
  await sharp(origem, { density: 384 }).resize(192, 192).png().toFile(destino('icon-192.png'));
  await sharp(origem, { density: 384 }).resize(512, 512).png().toFile(destino('icon-512.png'));
  await sharp(origem, { density: 384 }).resize(180, 180).png().toFile(destino('apple-touch-icon.png'));
  console.log('Icones gerados: icon-192.png, icon-512.png, apple-touch-icon.png');
}

gerar().catch(err => { console.error(err); process.exit(1); });
