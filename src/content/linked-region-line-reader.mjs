// The acceptance body below is an exact mechanical adaptation of the retained
// CPU checker. No Node module, filesystem, network or executable invocation.
export class LinkedLineBytes extends Uint8Array {
  readUInt16LE(at) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint16(at, true); }
  readUInt32LE(at) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(at, true); }
  readBigUInt64LE(at) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigUint64(at, true); }
  toString(encoding) {
    if (encoding === 'hex') return Array.from(this, x => x.toString(16).padStart(2, '0')).join('');
    if (encoding === 'utf8') return new TextDecoder('utf-8', { fatal: true }).decode(this);
    throw new Error('Unsupported byte display.');
  }
}
function deepSame(a, b) {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && deepSame(a[k], b[k]));
}
export function createLinkedLineReader(digestFor) {
  const assert = (v, message = 'Linked-line evidence disagrees.') => { if (!v) throw new Error(message); };
  assert.deepEqual = (a, b) => assert(deepSame(a, b));
  const Buffer = Object.freeze({
    isBuffer: x => x instanceof LinkedLineBytes,
    byteLength: s => new TextEncoder().encode(s).length,
    from: values => new LinkedLineBytes(values),
  });
const CAPS=Object.freeze({llvm:65536,expected:16384,report:65536,elf:1048576,dwarf:1048576,rows:8192,symbols:4096,sections:4096});
const ok=(v,m)=>assert(v,m), same=(a,b)=>assert.deepEqual(a,b);
const digest=digestFor;
function bytes(b,cap){ok(Buffer.isBuffer(b)&&b.length>0&&b.length<=cap,'bounded bytes');return b}
function text(b,cap){return new TextDecoder('utf-8',{fatal:true}).decode(bytes(b,cap))}
function keys(o,w){ok(o&&typeof o==='object'&&!Array.isArray(o),'object');same(Object.keys(o).sort(),w.slice().sort())}
const nat=(v,cap=Number.MAX_SAFE_INTEGER)=>{ok(Number.isSafeInteger(v)&&v>=0&&!Object.is(v,-0)&&v<=cap,'natural');return v};
const hx=x=>{ok(typeof x==='string'&&/^[0-9a-f]{64}$/.test(x)&&!/^0+$/.test(x),'sha256');return x};
const smallString=(s,cap)=>{ok(typeof s==='string'&&Buffer.byteLength(s)>0&&Buffer.byteLength(s)<=cap&&!s.includes('\0'),'bounded string');return s};
// Complete bounded JSON syntax with duplicate keys refused; no role projection
// can hide a second key, malformed primitive, trailing bytes or invalid UTF-8.
function json(b,cap=CAPS.report){
 const s=text(b,cap);let p=0,nodes=0;
 const fail=()=>{throw Error('closed JSON')},ws=()=>{while(p<s.length&&/[\t\r\n ]/.test(s[p]))p++};
 function str(key){const a=p++;let escaped=false;while(p<s.length){const c=s[p++];if(p-a>(key?130:16384))fail();if(!escaped&&c==='"')return JSON.parse(s.slice(a,p));if(!escaped&&c==='\\')escaped=true;else escaped=false}fail()}
 function value(d){if(d>16||++nodes>8192)fail();ws();if(s[p]==='{'){p++;const o=Object.create(null);let n=0;ws();if(s[p]==='}'){p++;return o}for(;;){ws();if(s[p]!=='"'||++n>128)fail();const k=str(true);if(Object.hasOwn(o,k))fail();ws();if(s[p++]!==':')fail();o[k]=value(d+1);ws();const c=s[p++];if(c==='}')return o;if(c!==',')fail()}}
 if(s[p]==='['){p++;const a=[];ws();if(s[p]===']'){p++;return a}for(;;){if(a.length>=1024)fail();a.push(value(d+1));ws();const c=s[p++];if(c===']')return a;if(c!==',')fail()}}
 if(s[p]==='"')return str(false);for(const [t,v]of [['true',true],['false',false],['null',null]])if(s.startsWith(t,p)){p+=t.length;return v}
 const m=s.slice(p,p+32).match(/^-?(?:0|[1-9][0-9]*)/);if(!m)fail();p+=m[0].length;const n=Number(m[0]);if(!Number.isSafeInteger(n)||Object.is(n,-0))fail();return n}
 const out=value(0);ws();if(p!==s.length)fail();return out;
}
function expected(llvmBytes,expectedBytes){
 bytes(llvmBytes,CAPS.llvm);const e=json(expectedBytes,CAPS.expected);
 keys(e,['schema','scenario','llvm','canonical','source_bytes','source_identity','kir_site','span','target','line_scope','source_custody_checked_in_callback','source_postflight_required','native_emitted','hardware_observed','grants_artifact_or_launch_authority']);
 same(e.schema,'private-ordered-region-line-export-v17');same(e.scenario,'edited');same(e.target,'gfx942:xnack-');same(e.line_scope,'whole-ordered-region');
 same(e.source_custody_checked_in_callback,true);same(e.source_postflight_required,true);for(const k of ['native_emitted','hardware_observed','grants_artifact_or_launch_authority'])same(e[k],false);
 for(const k of ['llvm','canonical','source_bytes']){keys(e[k],['bytes','sha256']);ok(nat(e[k].bytes, k==='source_bytes'?131072:CAPS.llvm)>0,'nonempty extent');hx(e[k].sha256)}
 same(e.llvm.bytes,llvmBytes.length);same(e.llvm.sha256,digest(llvmBytes));
 keys(e.source_identity,['frontend_unit','function','contract','statement']);Object.values(e.source_identity).forEach(hx);
 keys(e.kir_site,['function_ordinal','block_ordinal','block_id','operation_ordinal']);Object.values(e.kir_site).forEach(x=>nat(x));
 keys(e.span,['file_identity','display_path','file_bytes','byte_start','byte_end','line','column']);hx(e.span.file_identity);smallString(e.span.display_path,4096);
 same(e.span.file_bytes,e.source_bytes.bytes);nat(e.span.file_bytes,131072);nat(e.span.byte_start);nat(e.span.byte_end);ok(e.span.byte_start<e.span.byte_end&&e.span.byte_end<=e.span.file_bytes,'span extent');
 ok(nat(e.span.line,0xffffffff)>0&&nat(e.span.column,65535)>0,'source location');
 return e;
}
function range(b,o,n){nat(o,b.length);nat(n,b.length);ok(n<=b.length-o,'ELF extent');return b.subarray(o,o+n)}
const add=(a,b)=>{const n=a+b;ok(Number.isSafeInteger(n),'overflow');return n};
function u64(b,o){const n=b.readBigUInt64LE(o);ok(n<=BigInt(Number.MAX_SAFE_INTEGER),'ELF integer width');return Number(n)}
function cstr(b,o,cap){nat(o,b.length-1);let e=o;while(e<b.length&&e-o<=cap&&b[e]!==0)e++;ok(e<b.length&&e-o<=cap,'ELF name');return text(b.subarray(o,e),cap)}
// Independent ELF64 little-endian section/symbol join, not a relocation/load
// observation. The resulting VAs are linked-image VAs, never GPU runtime VAs.
function region(payload,c,symbol){
 bytes(payload,CAPS.elf);ok(payload.length>=64,'ELF header');
 same([...payload.subarray(0,7)],[127,69,76,70,2,1,1]);same(payload.readUInt16LE(16),3);same(payload.readUInt16LE(18),224);same(payload.readUInt32LE(20),1);same(payload.readUInt16LE(52),64);same(payload.readUInt16LE(58),64);
 const off=u64(payload,40),count=payload.readUInt16LE(60);ok(count>0&&count<=CAPS.sections,'ELF sections');range(payload,off,count*64);
 const sections=Array.from({length:count},(_,i)=>{const p=off+i*64;return {type:payload.readUInt32LE(p+4),flags:u64(payload,p+8),va:u64(payload,p+16),offset:u64(payload,p+24),size:u64(payload,p+32),link:payload.readUInt32LE(p+40),entsize:u64(payload,p+56)}});
 const tables=sections.filter(s=>s.type===2);same(tables.length,1);const tab=tables[0];same(tab.entsize,24);ok(tab.size%24===0&&tab.size/24<=CAPS.symbols,'ELF symbols');range(payload,tab.offset,tab.size);ok(tab.link<count,'ELF strings');const str=sections[tab.link];same(str.type,3);const names=range(payload,str.offset,str.size);
 const found=[];for(let i=0;i<tab.size/24;i++){const p=tab.offset+i*24;const no=payload.readUInt32LE(p);if(no===0)continue;const name=cstr(names,no,4096);if(name!==symbol)continue;const section=payload.readUInt16LE(p+6);ok(section>0&&section<count,'ELF symbol section');same(payload[p+4]&15,2);found.push({va:u64(payload,p+8),size:u64(payload,p+16),section:sections[section]})}
 same(found.length,1);const f=found[0],s=f.section;same(s.type,1);ok((s.flags&6)===6,'allocated executable section');range(payload,s.offset,s.size);ok(f.size>0&&f.va>=s.va&&f.va-s.va<=s.size&&f.size<=s.size-(f.va-s.va),'ELF function extent');
 const file=add(s.offset,f.va-s.va);same(c.entry_file_offset,file);same(c.entry_code_bytes,f.size);
 same(c.program_count,3);same(c.result_used,true);ok(Array.isArray(c.program)&&c.program.length===3,'three instructions');
 let begin;for(let i=0;i<3;i++){const x=c.program[i];nat(x.file_offset,payload.length);ok(typeof x.bytes_hex==='string'&&/^[0-9a-f]{8}$/.test(x.bytes_hex),'instruction encoding');if(i===0)begin=x.file_offset;else same(x.file_offset,begin+4*i);same(range(payload,x.file_offset,4).toString('hex'),x.bytes_hex)}
 ok(begin>=file&&begin-file<=f.size&&12<=f.size-(begin-file),'program in exact symbol');const start=add(f.va,begin-file),end=add(start,12);return {symbol,entry_va:f.va,entry_bytes:f.size,entry_file_offset:file,begin_va:start,end_va:end,begin_file_offset:begin,end_file_offset:begin+12,instruction_count:3};
}
const unquote=s=>{const v=JSON.parse(s);return smallString(v,4096)};
function lineIntervals(dump,span,r){
 const s=text(dump,CAPS.dwarf),lines=s.split(/\r?\n/);ok(lines.length<=32768,'line dump lines');
 same((s.match(/^debug_line\[0x[0-9a-fA-F]+\]/gm)||[]).length,1);const versions=[...s.matchAll(/^\s*version:\s*(\d+)\s*$/gm)];same(versions.length,1);same(Number(versions[0][1]),4);
 const maxOps=[...s.matchAll(/^\s*max_ops_per_inst:\s*(\d+)\s*$/gm)];same(maxOps.length,1);same(Number(maxOps[0][1]),1);
 const files=new Map(),dirs=new Map();let file=null,table=false,headers=0,rows=[];const name=/^\s*name:\s*("(?:[^"\\]|\\.)*")\s*$/;
 for(const line of lines){
  let m;if((m=line.match(/^\s*include_directories\[\s*(\d+)\]:?\s*=\s*("(?:[^"\\]|\\.)*")\s*$/))){const i=Number(m[1]);ok(!dirs.has(i),'duplicate directory');dirs.set(i,unquote(m[2]));continue}
  if((m=line.match(/^\s*file_names\[\s*(\d+)\]:\s*$/))){const i=Number(m[1]);ok(!files.has(i)&&files.size<16,'duplicate/excess file');file={index:i};files.set(i,file);continue}
  if((m=line.match(name))){ok(file&&!Object.hasOwn(file,'name'),'file name');file.name=unquote(m[1]);continue}
  if((m=line.match(/^\s*dir_index:\s*(\d+)\s*$/))){ok(file&&!Object.hasOwn(file,'dir'),'directory index');file.dir=Number(m[1]);continue}
  if(/^Address\s+Line\s+Column\s+File\s+ISA\s+Discriminator\s+OpIndex\s+Flags\s*$/.test(line)){table=true;headers++;file=null;continue}
  if(!table)continue;
  if(!line.trim()||/^-+(?:\s+-+)*\s*$/.test(line))continue;
  m=line.match(/^(0x[0-9a-fA-F]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+([a-z_ ]+))?\s*$/);
  ok(m,'unparsed line-table row');ok(rows.length<CAPS.rows,'row cap');
  const a=BigInt(m[1]);ok(a<=BigInt(Number.MAX_SAFE_INTEGER),'address width');same(nat(Number(m[7])),0);const flags=(m[8]||'').trim().split(/\s+/).filter(Boolean);ok(flags.every(x=>['is_stmt','basic_block','end_sequence','prologue_end','epilogue_begin'].includes(x)),'row flags');
  rows.push({address:Number(a),line:nat(Number(m[2]),0xffffffff),column:nat(Number(m[3]),65535),file:nat(Number(m[4]),65535),isa:nat(Number(m[5])),discriminator:nat(Number(m[6])),end:flags.includes('end_sequence')});
 }
 same(headers,1);ok(rows.length>1,'line rows');
 for(const f of files.values()){ok(Object.hasOwn(f,'name')&&Object.hasOwn(f,'dir'),'complete file table');if(f.name.startsWith('/'))f.path=f.name;else if(f.dir===0)f.path=f.name;else{ok(dirs.has(f.dir),'known directory');f.path=dirs.get(f.dir).replace(/\/$/,'')+'/'+f.name}}
 const overlaps=[];let previous=null;for(const row of rows){if(previous){ok(row.address>=previous.address,'monotone sequence');if(row.address>previous.address){const a=Math.max(previous.address,r.begin_va),b=Math.min(row.address,r.end_va);if(a<b){const f=files.get(previous.file);ok(f,'row file');same(f.path,span.display_path);same(previous.line,span.line);same(previous.column,span.column);overlaps.push({begin_va:a,end_va:b,row_begin_va:previous.address,row_end_va:row.address,file:f.path,line:previous.line,column:previous.column,discriminator:previous.discriminator})}}}previous=row.end?null:row}
 same(previous,null);ok(overlaps.length>0,'covered region');overlaps.sort((a,b)=>a.begin_va-b.begin_va);let cursor=r.begin_va;for(const x of overlaps){same(x.begin_va,cursor);cursor=x.end_va}same(cursor,r.end_va);return overlaps;
}
function verifier(stdout,stderr){text(stdout,CAPS.dwarf);ok(Buffer.isBuffer(stderr)&&stderr.length===0,'verifier stderr');ok(/No errors\.\s*$/.test(stdout.toString('utf8')),'verify completion')}

function sourceJoin(pairBytes,e,expectedBytes){
 const p=json(pairBytes,CAPS.report);
 same(p.kind,'private_actual_source_candidate_debug_join');same(p.actual_rustc_callbacks,2);same(p.fixed_environment_sequential_sessions,2);ok(Array.isArray(p.observations)&&p.observations.length===2,'source pair');
 const hexArray=x=>{ok(Array.isArray(x)&&x.length===32,'digest array');return Buffer.from(x.map(v=>nat(v,255))).toString('hex')};
 for(let i=0;i<2;i++){const row=p.observations[i],phase=['default','edited'][i];same(row.invocation.phase,phase);same(row.observation.source_rechecked_after_line_export,true);const x=row.observation.ordered_region_line_export;
  same(x.llvm_file,phase+'.ll');same(x.expected_file,phase+'.expected.json');same(x.publication_is_source_or_native_authority,false);same(x.combined_logical_payload_limit,134217728);nat(x.prepaid_combined_logical_payload,134217728);
  if(i===1){same(x.llvm,e.llvm);same(x.expected.bytes,expectedBytes.length);same(x.expected.sha256,digest(expectedBytes));same(row.invocation.source_sha256,e.source_bytes.sha256);same(hexArray(row.observation.fresh.candidate_sha256),e.source_bytes.sha256);same(hexArray(row.observation.fresh.kernel_ir_sha256),e.canonical.sha256)}
 }
 ok(p.observations[0].invocation.source_sha256!==e.source_bytes.sha256,'old source is distinct');ok(hexArray(p.observations[0].observation.fresh.kernel_ir_sha256)!==e.canonical.sha256,'old KIR is distinct');
 return {bytes:pairBytes.length,sha256:digest(pairBytes)};
}

function accept({llvm,expectedBytes,pairBytes,report,objects,dumps}){
 const e=expected(llvm,expectedBytes),sourcePair=sourceJoin(pairBytes,e,expectedBytes),o=json(report);
 same(o.schema,'fe2o3-ordered-region-line-native-observation-v17');same(o.llvm_sha256,e.llvm.sha256);same(o.llvm_bytes,e.llvm.bytes);smallString(o.kernel_symbol,128);ok(/^[A-Za-z_][A-Za-z0-9_]*$/.test(o.kernel_symbol),'kernel symbol');
 for(const k of ['line_table_verified','source_authentication','protected_admission','hardware_executed'])same(o[k],false);same(o.synthetic_worker_request_identity_fields,true);ok(Array.isArray(o.cases)&&o.cases.length===2,'two optimization cases');
 keys(objects,['O0','O3']);keys(dumps,['O0','O3']);const accepted=[];
 for(let i=0;i<2;i++){const level=['O0','O3'][i],c=o.cases[i];same(c.optimization,level);same(c.llvm_text_sha256,e.llvm.sha256);same(c.llvm_text_bytes,e.llvm.bytes);same(c.payload_file,level+'.hsaco');same(c.profile,'three');const payload=bytes(objects[level],CAPS.elf);same(c.hsaco_bytes,payload.length);same(c.hsaco_sha256,digest(payload));const d=dumps[level];keys(d,['verify_stdout','verify_stderr','line_stdout','line_stderr']);ok(Buffer.isBuffer(d.line_stderr)&&d.line_stderr.length===0,'line stderr');verifier(d.verify_stdout,d.verify_stderr);const r=region(payload,c,o.kernel_symbol);accepted.push({optimization:level,payload:{bytes:payload.length,sha256:digest(payload)},region:r,coverage:lineIntervals(d.line_stdout,e.span,r)});}
 return {schema:'private-m5-linked-region-line-acceptance-v1',source_pair:sourcePair,observer_report:{bytes:report.length,sha256:digest(report)},scenario:'edited',llvm:e.llvm,canonical:e.canonical,source_bytes:e.source_bytes,source_identity:e.source_identity,kir_site:e.kir_site,span:e.span,cases:accepted,linked_line_table_verified:true,whole_region_only:true,source_custody:'root-selected same-owner export evidence; not reconstructed by this parser',runtime_load_address_observed:false,hardware_observed:false,grants_artifact_or_launch_authority:false};
}

return Object.freeze({ accept, json, expected, region, lineIntervals });
}
