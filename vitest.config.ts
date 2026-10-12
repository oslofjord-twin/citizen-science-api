import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		execArgv: ["--import", "tsx"],
		pool: "forks",
		isolate: true,
	},
});
