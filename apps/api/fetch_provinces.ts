import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const API_BASE = 'https://provinces.open-api.vn/api/v2';
  const pRes = await fetch(API_BASE + '/p/');
  const provinces = await pRes.json();
  const result = [];
  
  for (const p of provinces) {
    const wRes = await fetch(API_BASE + '/p/' + p.code + '?depth=2');
    const wData = await wRes.json();
    result.push(wData);
  }
  
  const targetDir = path.join(__dirname, 'src', 'modules', 'addresses', 'data');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(targetDir, 'provinces_data.json'), JSON.stringify(result, null, 2));
  console.log('Done!');
}

main().catch(console.error);
