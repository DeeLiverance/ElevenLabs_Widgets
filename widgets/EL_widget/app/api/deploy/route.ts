import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { type NextRequest } from 'next/server';

export const runtime = 'nodejs';

/**
 * Returns the absolute path to the 1.0 OpenAI_EL_Voice_Code repo root.
 * Reads EL_VOICE_CODE_REPO_ROOT from the environment first; falls back to
 * the expected sibling path relative to this Next.js project root.
 *
 * Relative default: EL_widget is 3 levels deep inside
 *   ElevenLabs_Widgets/widgets/EL_widget
 * so ../../../ reaches the Ai_Agent_tools directory, then into the sibling repo.
 */
function getVoiceCodeRepoRoot(): string {
  const envRoot = process.env.EL_VOICE_CODE_REPO_ROOT;
  if (envRoot) return envRoot;
  return path.resolve(process.cwd(), '../../../1.0 OpenAI_EL_Voice_Code');
}

function encodeSSE(data: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * POST /api/deploy
 * Body: { environment?: 'dev' | 'prod' }   (defaults to 'dev')
 *
 * Returns a Server-Sent Events stream.  Each event is:
 *   data: "<line text>"
 *
 * Line prefixes:
 *   [setup]     — pre-flight info
 *   [copy]      — a JSON file was synced across repos
 *   [deploy]    — deploy step started
 *   [cloud run] — stdout from the PS1 script
 *   [stderr]    — stderr from the PS1 script
 *   [done]      — deploy completed successfully
 *   [error]     — something failed (stream closes after this)
 */
export async function POST(request: NextRequest) {
  let environment: 'dev' | 'prod' = 'dev';
  try {
    const body = (await request.json()) as { environment?: string };
    if (body.environment === 'prod') environment = 'prod';
  } catch {
    // default to dev
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (line: string) => {
        try {
          controller.enqueue(encodeSSE(line));
        } catch {
          // stream already closed — ignore
        }
      };

      const voiceCodeRoot = getVoiceCodeRepoRoot();
      const srcDir = path.join(process.cwd(), 'brand-profiles', 'repo-json');
      const dstDir = path.join(voiceCodeRoot, 'widgets', 'brand-profiles', 'repo-json');
      const deployScript = path.join(
        voiceCodeRoot,
        'backend',
        'deploy_widget_config_api_cloudrun.ps1',
      );

      send(`[setup] Environment: ${environment}`);
      send(`[setup] Voice code repo: ${voiceCodeRoot}`);
      send(`[setup] Source profiles: ${srcDir}`);
      send(`[setup] Target profiles: ${dstDir}`);

      // ── Step 1: sync brand profile JSONs across repos ─────────────────────
      if (!fs.existsSync(srcDir)) {
        send(`[error] Source profile directory not found: ${srcDir}`);
        controller.close();
        return;
      }

      try {
        if (!fs.existsSync(dstDir)) {
          fs.mkdirSync(dstDir, { recursive: true });
        }
        const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.json'));
        if (files.length === 0) {
          send('[error] No JSON profile files found in source directory.');
          controller.close();
          return;
        }
        for (const file of files) {
          fs.copyFileSync(path.join(srcDir, file), path.join(dstDir, file));
          send(`[copy] ${file}`);
        }
        send(`[copy] ${files.length} profile(s) synced to sibling repo.`);
      } catch (err) {
        send(`[error] Failed to copy profiles: ${String(err)}`);
        controller.close();
        return;
      }

      // ── Step 2: run the Cloud Run deploy script ───────────────────────────
      if (!fs.existsSync(deployScript)) {
        send(`[error] Deploy script not found: ${deployScript}`);
        send(
          `[error] Set EL_VOICE_CODE_REPO_ROOT in .env.local to point to the 1.0 OpenAI_EL_Voice_Code repo root.`,
        );
        controller.close();
        return;
      }

      send(`[deploy] Starting Cloud Run deploy — this takes 2–3 minutes…`);

      await new Promise<void>((resolve) => {
        const proc = spawn(
          'powershell.exe',
          ['-ExecutionPolicy', 'Bypass', '-File', deployScript, '-Environment', environment],
          { cwd: voiceCodeRoot },
        );

        const emitLines = (prefix: string, chunk: Buffer) => {
          for (const line of chunk.toString().split(/\r?\n/)) {
            const trimmed = line.trim();
            if (trimmed) send(`[${prefix}] ${trimmed}`);
          }
        };

        proc.stdout.on('data', (chunk: Buffer) => { emitLines('cloud run', chunk); });
        proc.stderr.on('data', (chunk: Buffer) => { emitLines('stderr', chunk); });

        proc.on('close', (code) => {
          if (code === 0) {
            send('[done] Deploy complete. Hard-refresh the hosted widget to pick up changes.');
          } else {
            send(`[error] Deploy script exited with code ${String(code)}.`);
          }
          resolve();
        });

        proc.on('error', (err) => {
          send(`[error] Failed to start deploy script: ${err.message}`);
          send(`[error] Is powershell.exe on your PATH and gcloud authenticated?`);
          resolve();
        });
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
