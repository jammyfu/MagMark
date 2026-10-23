import { CoverPanel } from '../src/cover/cover-panel';
import * as model from '../src/cover/responsive/model';
import * as renderer from '../src/cover/responsive/render';
Object.assign(window, { coverFixture: { CoverPanel, ...model, ...renderer } });
