import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type GateRejectReason = "min_side" | "vlm_gate" | "classifier";

export interface GateResult {
  accepted: boolean;
  reason?: GateRejectReason;
  width?: number;
  height?: number;
  vlm_score?: number;
  vlm_threshold?: number;
  classifier_label?: string;
  classifier_confidence?: number;
  classifier_threshold?: number;
}

const execFileAsync = (
  file: string,
  args: string[],
  options: { timeoutMs: number }
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    execFile(file, args, { timeout: options.timeoutMs }, (error, stdout, stderr) => {
      if (error) {
        const err = new Error(
          `Image gate failed: ${error instanceof Error ? error.message : String(error)}${
            stderr ? `\n${stderr}` : ""
          }`
        );
        (err as any).cause = error;
        reject(err);
        return;
      }
      resolve({ stdout: String(stdout), stderr: String(stderr) });
    });
  });
};

const getDefaults = () => {
  const apiRoot = path.resolve(__dirname, "../../../");
  const gateScript = path.join(apiRoot, "sort", "gate_predict.py");
  const modelDir = path.join(apiRoot, "sort", "models");

  return {
    pythonCmd: process.env.SECCHI_PYTHON || "python3",
    gateScript: process.env.SECCHI_GATE_SCRIPT || gateScript,
    modelDir: process.env.SECCHI_MODEL_DIR || modelDir,
    device: process.env.SECCHI_DEVICE || "auto",
    minSide: process.env.SECCHI_MIN_SIDE_PX || "224",
    vlmCheckpoint: process.env.SECCHI_VLM_CHECKPOINT || "google/siglip2-base-patch16-224",
    vlmThreshold: process.env.SECCHI_VLM_THRESHOLD || "0.0878",
    classifierThreshold: process.env.SECCHI_CLASSIFIER_THRESHOLD || "0.7",
    timeoutMs: Number(process.env.SECCHI_GATE_TIMEOUT_MS || 60_000),
  };
};

export const runImageGate = async (imagePath: string): Promise<GateResult> => {
  const cfg = getDefaults();
  const gateUrl = process.env.SECCHI_GATE_URL;

  let stdout: string;
  if (gateUrl) {
    // Warm-worker path: a long-lived Python process holds SigLIP-2 and the
    // ResNet in memory; we just send it an image path over HTTP. Eliminates
    // the cold-start cost (~8s per request) of execFile + model load.
    const resp = await fetch(`${gateUrl.replace(/\/$/, "")}/gate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_path: imagePath,
        min_side: Number(cfg.minSide),
        vlm_threshold: Number(cfg.vlmThreshold),
        classifier_threshold: Number(cfg.classifierThreshold),
      }),
      signal: AbortSignal.timeout(cfg.timeoutMs),
    });
    const text = await resp.text();
    if (!resp.ok) {
      throw new Error(`Image gate worker returned ${resp.status}: ${text.slice(0, 500)}`);
    }
    stdout = text;
  } else {
    const args = [
      cfg.gateScript,
      "--image", imagePath,
      "--model-dir", cfg.modelDir,
      "--device", cfg.device,
      "--min-side", cfg.minSide,
      "--vlm-checkpoint", cfg.vlmCheckpoint,
      "--vlm-threshold", cfg.vlmThreshold,
      "--classifier-threshold", cfg.classifierThreshold,
    ];
    ({ stdout } = await execFileAsync(cfg.pythonCmd, args, { timeoutMs: cfg.timeoutMs }));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.trim());
  } catch {
    throw new Error(`Image gate returned non-JSON output: ${stdout.slice(0, 500)}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Image gate returned empty result");
  }

  const r = parsed as Record<string, unknown>;
  if (typeof r.accepted !== "boolean") {
    throw new Error("Image gate returned invalid JSON shape");
  }

  // gate_predict.py is fail-closed: any exception during model load or scoring
  // is emitted as accepted=false, reason=vlm_gate, error=<msg>. That makes a
  // missing python dependency look identical to a legitimately-low VLM score,
  // and every submission gets rejected silently. Surface those as a real
  // server error instead of pretending the user's image was the problem.
  if (typeof r.error === "string" && r.error.length > 0) {
    const cfgHint = gateUrl
      ? `SECCHI_GATE_URL=${gateUrl}`
      : `SECCHI_PYTHON=${cfg.pythonCmd}, gateScript=${cfg.gateScript}`;
    throw new Error(`Image gate setup failure: ${r.error} (${cfgHint})`);
  }

  return r as unknown as GateResult;
};
