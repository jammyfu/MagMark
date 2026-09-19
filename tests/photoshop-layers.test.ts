import { it } from 'vitest';
import { layerCases } from './photoshop-layer-cases';
for (const [name, run] of layerCases) it(name, run);
