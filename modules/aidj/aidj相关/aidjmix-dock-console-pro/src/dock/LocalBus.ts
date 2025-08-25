export type Event = { namespace:string; type:string; data?:any; timestamp?:number };
type CB = (e: Event)=>void;
export default class LocalBus {
  private map = new Map<string, Set<CB>>();
  on(ns:string, type:string, cb:CB){
    const k = ns+':'+type;
    if(!this.map.has(k)) this.map.set(k, new Set());
    this.map.get(k)!.add(cb);
    return () => this.map.get(k)!.delete(cb);
  }
  emit(e:Event){
    const k = e.namespace+':'+e.type;
    this.map.get(k)?.forEach(cb=>{ try{ cb(e) }catch{} });
  }
  emitBpm(bpm:number){ this.emit({namespace:'automix', type:'bpm', data:{bpm}, timestamp:Date.now()}); }
  emitPlayback(state:'play'|'pause'|'stop'){ this.emit({namespace:'automix', type:'playback', data:{playbackState:state}, timestamp:Date.now()}); }
  emitPreset(name:string){ this.emit({namespace:'visualization', type:'preset', data:{name}, timestamp:Date.now()}); }
}
