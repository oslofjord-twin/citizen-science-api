import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globalSetup: "./tests/setup.ts",
		execArgv: ["--import", "tsx"],
		pool: "forks",
		isolate: true,
		fileParallelism: false,
	},
});
