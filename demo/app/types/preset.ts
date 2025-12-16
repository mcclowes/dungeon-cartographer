import type { GeneratorType, GeneratorParams } from "./generator";

export interface Preset {
  name: string;
  description: string;
  generator: GeneratorType;
  size: number;
  params: GeneratorParams;
}
