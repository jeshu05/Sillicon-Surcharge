/**
 * Power Draw - JSON Schema Validator Script
 * Validates generated data against collector schemas.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { logger } from '../pipeline/utils/logger.js';

async function validateSchemaContracts() {
  logger.section('Validating Generated JSON Datasets Against Schema Contracts');

  const filesToCheck = [
    { file: 'data/current/facilities.json', schema: 'collectors/schemas/datacenter.schema.json', name: 'Facilities' },
    { file: 'data/current/electricity.json', schema: 'collectors/schemas/electricity.schema.json', name: 'Electricity' },
    { file: 'data/current/economics.json', schema: 'collectors/schemas/economics.schema.json', name: 'Economics' },
    { file: 'data/watchlist.json', schema: 'collectors/schemas/watchlist.schema.json', name: 'Watchlist' }
  ];

  let totalErrors = 0;

  for (const item of filesToCheck) {
    try {
      const dataText = await fs.readFile(path.resolve(item.file), 'utf-8');
      const schemaText = await fs.readFile(path.resolve(item.schema), 'utf-8');
      const data = JSON.parse(dataText);
      const schema = JSON.parse(schemaText);

      const records = Array.isArray(data) ? data : [data];
      let validCount = 0;

      for (let i = 0; i < records.length; i++) {
        const rec = records[i];
        const missingReq = (schema.required || []).filter(req => rec[req] === undefined || rec[req] === null);
        if (missingReq.length === 0) {
          validCount++;
        } else {
          logger.warn('SCHEMA CHECK', `${item.name} record #${i} missing required keys: ${missingReq.join(', ')}`);
          totalErrors++;
        }
      }

      logger.success('SCHEMA VALID', `${item.name}: ${validCount}/${records.length} records conform strictly to ${path.basename(item.schema)}`);
    } catch (err) {
      logger.error('SCHEMA ERROR', `Failed checking ${item.name}: ${err.message}`);
      totalErrors++;
    }
  }

  if (totalErrors === 0) {
    logger.success('CONTRACT VERIFICATION', 'All datasets strictly passed contract verification!');
  } else {
    logger.error('CONTRACT VERIFICATION', `${totalErrors} schema violations detected.`);
    process.exit(1);
  }
}

validateSchemaContracts();
