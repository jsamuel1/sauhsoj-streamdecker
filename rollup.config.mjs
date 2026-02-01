import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/plugin.ts",
  output: {
    file: "wtf.sauhsoj.streamdecker.sdPlugin/bin/plugin.js",
    format: "es",
    sourcemap: true,
  },
  external: ["child_process", "util"],
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    typescript(),
  ],
};
