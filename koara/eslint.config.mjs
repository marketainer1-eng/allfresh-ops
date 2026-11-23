import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** eslint-config-next 16 은 flat config 를 그대로 내보낸다. */
const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...coreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
