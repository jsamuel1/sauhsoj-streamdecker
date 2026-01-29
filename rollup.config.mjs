import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/plugin.ts",
  output: {
    file: "wtf.sauhsoj.streamdecker.sdPlugin/bin/plugin.js",
    format: "es",
    sourcemap: true,
    // Expose connection at module level
    intro: "let __neo_connection = null;",
  },
  external: ["child_process", "util"],
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    typescript(),
    // Inject code to capture connection reference
    {
      name: "capture-connection",
      renderChunk(code) {
        // After "const connection = new Connection();" add our capture
        return code.replace(
          /const connection = new Connection\(\);/,
          "const connection = new Connection();\n__neo_connection = connection;"
        );
      },
    },
  ],
};
