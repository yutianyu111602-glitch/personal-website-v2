/**
 * EngineBridge.ts — 渲染赋值桥
 * ------------------------------------------------------------
 * [FOR CURSOR / 给 Cursor]
 *   Map Pipeline -> weights/uniforms. Render layer owns WebGL. Keep this pure.
 *
 * [FOR HUMANS / 给人看]
 *   把 pipeline 转成可直接喂给 Shader 的赋值项；不要在这里引入渲染依赖。
 */

export type UniformAssignment={ scope:'global'|'node'; nodeId?:string; key:string; value:number; };
export type WeightAssignment={ id:string; weight:number; };

export function pipelineToAssignments(pipeline:{nodes:{id:string,weight:number,uniforms?:Record<string,number>}[]}){
  const weights:WeightAssignment[]=pipeline.nodes.map(n=>({id:n.id,weight:n.weight}));
  const uniforms:UniformAssignment[]=[];
  for(const n of pipeline.nodes){
    if(!n.uniforms) continue;
    for(const [k,v] of Object.entries(n.uniforms)){
      if(n.id==='Global'||k.startsWith('Global.')) uniforms.push({scope:'global',key:k.replace(/^Global\./,''),value:v});
      else uniforms.push({scope:'node',nodeId:n.id,key:k,value:v});
    }
  }
  return {weights,uniforms};
}

export function gatekeepWeights(weights:WeightAssignment[],avgFrameMs:number){
  const fps=1000/Math.max(1,avgFrameMs);
  if(fps<55){ for(const w of weights) if(w.id==='BloomHL') w.weight=0; }
  if(fps<48){ for(const w of weights) if(['GrainMerge','EdgeTint','TemporalTrail'].includes(w.id)) w.weight*=0.7; }
  return weights;
}
