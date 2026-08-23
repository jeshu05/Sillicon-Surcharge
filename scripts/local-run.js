/**
 * Power Draw - Local Development & Quick Run Utility
 */

import { runPipeline } from '../pipeline/run.js';
import { logger } from '../pipeline/utils/logger.js';

async function main() {
  logger.section('Power Draw Local Execution');
  try {
    await runPipeline();
    logger.success('LOCAL RUN', 'Pipeline completed successfully. Datasets are fresh in data/.');
    console.log('\n⚡ Run `npm run serve` to launch the static dashboard at http://localhost:3000\n');
  } catch (err) {
    logger.error('LOCAL RUN', 'Execution failed', err);
    process.exit(1);
  }
}

main();
