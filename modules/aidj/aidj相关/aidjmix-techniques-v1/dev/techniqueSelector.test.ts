// dev/techniqueSelector.test.ts — quick smoke tests (run with ts-node or vitest)
import { chooseTechnique } from '../src/console/techniqueSelector';

function logCase(name:string, ctx:any){
  const d = chooseTechnique(ctx);
  console.log(name, '→', d.technique, d.hint, d.reason.join(' | '));
}

logCase('simple', { bpmFrom:126, bpmTo:128, keyFrom:'8A', keyTo:'9A', segment:'steady', simpleHeadTail:true });
logCase('build slow', { bpmFrom:124, bpmTo:124, keyFrom:'8A', keyTo:'8A', segment:'build' });
logCase('drop fast compat', { bpmFrom:142, bpmTo:142, keyFrom:'8A', keyTo:'9A', segment:'drop' });
logCase('fill vocal', { bpmFrom:130, bpmTo:130, keyFrom:'8A', keyTo:'7B', segment:'fill', vocality:0.6 });
logCase('incompatible key', { bpmFrom:129, bpmTo:129, keyFrom:'1A', keyTo:'9B' });
