let verbose = false;

export function setVerbose(v: boolean) {
  verbose = v;
}

export function log(message: string) {
  console.log(message);
}

export function debug(message: string) {
  if (verbose) console.log(`  ${message}`);
}

export function warn(message: string) {
  console.warn(`warning: ${message}`);
}

export function error(message: string) {
  console.error(`error: ${message}`);
}
