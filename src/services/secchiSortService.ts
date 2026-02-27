import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface SecchiPrediction {
  file: string;
  label: string;
  confidence: number;
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
          `Secchi predictor failed: ${error instanceof Error ? error.message : String(error)}${
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
  // citizen-science-api/src/services -> citizen-science-api/src -> citizen-science-api -> api
  const apiRoot = path.resolve(__dirname, "../../../");
  const predictScript = path.join(apiRoot, "sort", "predict.py");
  const modelDir = path.join(apiRoot, "sort", "models");

  return {
    pythonCmd: process.env.SECCHI_PYTHON || "python3",
    predictScript: process.env.SECCHI_PREDICT_SCRIPT || predictScript,
    modelDir: process.env.SECCHI_MODEL_DIR || modelDir,
    device: process.env.SECCHI_DEVICE || "auto",
    timeoutMs: Number(process.env.SECCHI_TIMEOUT_MS || 30_000),
  };
};

export const predictSecchiFromImagePath = async (imagePath: string): Promise<SecchiPrediction> => {
  const { pythonCmd, predictScript, modelDir, device, timeoutMs } = getDefaults();

  const args = [
    predictScript,
    "--model-dir",
    modelDir,
    "--input",
    imagePath,
    "--device",
    device,
    "--format",
    "json",
  ];

  const { stdout } = await execFileAsync(pythonCmd, args, { timeoutMs });

  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.trim());
  } catch {
    throw new Error(`Secchi predictor returned non-JSON output: ${stdout.slice(0, 500)}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Secchi predictor returned empty result");
  }

  const asAny = parsed as any;
  if (typeof asAny.label !== "string" || typeof asAny.confidence !== "number" || typeof asAny.file !== "string") {
    throw new Error("Secchi predictor returned invalid JSON shape");
  }

  return {
    file: asAny.file,
    label: asAny.label,
    confidence: asAny.confidence,
  };
};
