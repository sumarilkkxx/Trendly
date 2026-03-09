import { runScan } from '../services/scanner.js';

async function main() {
  try {
    const result = await runScan();
    console.log('runScan result:', result);
    process.exit(0);
  } catch (e) {
    console.error('runScan error:', e);
    process.exit(1);
  }
}

main();

