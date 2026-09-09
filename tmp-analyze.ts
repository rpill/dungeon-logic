import { analyzeHumanSolvability } from './src/puzzle/human-solver/HumanSolver';
import { level as t3 } from './src/content/tutorial/levels/tutorial003';
import { level as t4 } from './src/content/tutorial/levels/tutorial004';
for (const level of [t3,t4]) {
 console.log('\n'+level.id);
 const r=analyzeHumanSolvability(level);
 console.log(r.status, r.steps.length);
 for (const s of r.steps) console.log(s.index, s.rule, JSON.stringify(s.assignments), s.explanation);
}
