import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig({
	test: {
		globalSetup: "./tests/setup.ts",
		execArgv: ["--import", "tsx"],
		pool: "forks",
		isolate: true,
		fileParallelism: false,
		env: loadEnv("test", process.cwd(), ""),
	},
});
