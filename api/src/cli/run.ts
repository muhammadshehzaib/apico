import { loadCollectionFromFile } from './loadCollection';
import { loadEnvironmentFromFile } from './loadEnvironment';
import { runCollection } from './runner';
import { printProgress, printSummary, writeJUnitXml } from './reporter';

interface ParsedArgs {
  collection?: string;
  env?: string;
  reporter?: { kind: 'junit'; path: string };
  bail: boolean;
  help: boolean;
}

const USAGE = `apico run — execute a Postman collection from the command line

Usage:
  apico run <collection.json> [options]

Options:
  --env <file>           Postman environment JSON file (or plain { key: value } JSON)
  --reporter junit:<path>  Also emit JUnit XML to the given path
  --bail                 Stop on first failure
  -h, --help             Show this help

Examples:
  apico run tests.postman_collection.json
  apico run tests.postman_collection.json --env local.json
  apico run tests.postman_collection.json --env staging.json --reporter junit:results/junit.xml
`;

const parseArgs = (argv: string[]): ParsedArgs => {
  const out: ParsedArgs = { bail: false, help: false };
  const args = argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === 'run') continue;
    if (a === '-h' || a === '--help') {
      out.help = true;
      continue;
    }
    if (a === '--bail') {
      out.bail = true;
      continue;
    }
    if (a === '--env') {
      out.env = args[++i];
      continue;
    }
    if (a === '--reporter') {
      const val = args[++i] || '';
      const m = val.match(/^junit:(.+)$/);
      if (!m) {
        console.error(`Unknown reporter format: ${val}. Expected 'junit:<path>'.`);
        process.exit(2);
      }
      out.reporter = { kind: 'junit', path: m[1] };
      continue;
    }
    if (a.startsWith('-')) {
      console.error(`Unknown option: ${a}`);
      process.exit(2);
    }
    if (!out.collection) {
      out.collection = a;
      continue;
    }
  }

  return out;
};

const main = async () => {
  const args = parseArgs(process.argv);

  if (args.help || !args.collection) {
    process.stdout.write(USAGE);
    process.exit(args.collection ? 0 : 2);
  }

  let collection;
  try {
    collection = loadCollectionFromFile(args.collection);
  } catch (err) {
    console.error(`✗ ${err instanceof Error ? err.message : err}`);
    process.exit(2);
  }

  let environment: Record<string, string> = {};
  if (args.env) {
    try {
      environment = loadEnvironmentFromFile(args.env);
    } catch (err) {
      console.error(`✗ ${err instanceof Error ? err.message : err}`);
      process.exit(2);
    }
  }

  process.stdout.write(`\nRunning ${collection.name} (${collection.requests.length} request${collection.requests.length === 1 ? '' : 's'})\n\n`);

  const summary = await runCollection(collection.requests, environment, {
    bail: args.bail,
    onProgress: (r) => printProgress(r),
  });

  printSummary(summary, collection.name);

  if (args.reporter?.kind === 'junit') {
    writeJUnitXml(summary, collection.name, args.reporter.path);
    process.stdout.write(`  Wrote JUnit XML to ${args.reporter.path}\n`);
  }

  // Exit code: 0 if all passed, 1 if any failed/errored
  process.exit(summary.failed === 0 && summary.errored === 0 ? 0 : 1);
};

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
