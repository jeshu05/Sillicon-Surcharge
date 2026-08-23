/**
 * Power Draw - Structured Console & Telemetry Logger
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

export const logger = {
  info: (tag, msg, data = null) => {
    const time = new Date().toISOString().substring(11, 19);
    console.log(`${colors.gray}[${time}]${colors.reset} ${colors.cyan}[${tag}]${colors.reset} ${msg}`);
    if (data) console.log(colors.dim + JSON.stringify(data, null, 2) + colors.reset);
  },
  success: (tag, msg) => {
    const time = new Date().toISOString().substring(11, 19);
    console.log(`${colors.gray}[${time}]${colors.reset} ${colors.green}✔ [${tag}]${colors.reset} ${colors.bright}${msg}${colors.reset}`);
  },
  warn: (tag, msg) => {
    const time = new Date().toISOString().substring(11, 19);
    console.log(`${colors.gray}[${time}]${colors.reset} ${colors.yellow}⚠ [${tag}]${colors.reset} ${msg}`);
  },
  error: (tag, msg, err = null) => {
    const time = new Date().toISOString().substring(11, 19);
    console.log(`${colors.gray}[${time}]${colors.reset} ${colors.red}✖ [${tag}]${colors.reset} ${colors.bright}${msg}${colors.reset}`);
    if (err) console.error(colors.red, err, colors.reset);
  },
  section: (title) => {
    console.log(`\n${colors.magenta}══════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}  ⚡ ${title.toUpperCase()} ⚡${colors.reset}`);
    console.log(`${colors.magenta}══════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);
  }
};
