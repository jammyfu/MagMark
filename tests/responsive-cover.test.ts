import { it, expect } from 'vitest';
import { cases } from './responsive-cover-cases';
for (const scenario of cases) it(scenario.name, () => scenario.run((value, message) => expect(value, message).toBeTruthy()));
