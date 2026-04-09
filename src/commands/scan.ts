import { runInit } from "./init.js";

export interface ScanOptions {
  projectDir: string;
  noCache?: boolean;
}

export async function runScan(options: ScanOptions): Promise<void> {
  await runInit({
    projectDir: options.projectDir,
    noCache: options.noCache,
    dryRun: true,
  });
}
