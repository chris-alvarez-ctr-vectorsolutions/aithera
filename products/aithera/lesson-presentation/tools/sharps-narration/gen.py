"""Build the Sharps Listen-carrier narration (placeholder voice).

  cd products/aithera/lesson-presentation
  bash tools/sharps-narration/build.sh

1. extract.js pulls every screen's narration out of js/layered-sharps.js
   (DECK + DECK_LENS) into <work>/narr.json.
2. This script voices it sentence by sentence with macOS `say -v Samantha`,
   joins the sentences with a 0.32s pause into one AAC file per screen in
   assets/audio/sharps/, and records sentence timings + a 30 Hz loudness
   envelope.
3. build.sh writes those into js/sharps-narration.js (window.SHARPS_NARRATION).
Bump sharps-narration.js?v= in clara/sharps.html afterwards.
"""
import json, re, subprocess, wave, struct, math, os, sys
S=sys.argv[2] if len(sys.argv)>2 else '/tmp/sharps-narration'; OUT=sys.argv[1]
os.makedirs(os.path.join(S,'aud'),exist_ok=True)
narr=json.load(open(os.path.join(S,'narr.json')))
SPLIT=re.compile(r'(?<=[.?!”])\s+(?=[A-Z“"])')
GAP=0.32; RATE=None; ENV_HZ=30
data={}
for key, paras in narr.items():
    sents=[]
    for pi,p in enumerate(paras):
        for t in SPLIT.split(p.strip()):
            if t: sents.append((pi,t))
    frames_all=b''; params=None; timeline=[]; t0=0.0
    for si,(pi,t) in enumerate(sents):
        f=os.path.join(S,'aud','tmp.wav')
        subprocess.run(['say','-v','Samantha','-o',f,'--file-format=WAVE','--data-format=LEI16@22050',t],check=True)
        a=wave.open(f,'rb'); params=a.getparams(); fr=a.readframes(a.getnframes()); a.close()
        dur=len(fr)/2/params.framerate
        timeline.append({'p':pi,'t':t,'s':round(t0,3),'e':round(t0+dur,3)})
        gap=b'\x00\x00'*int(GAP*params.framerate)
        frames_all+=fr+gap; t0+=dur+GAP
    # envelope: RMS per 1/ENV_HZ s, quantized 0-35 (base36 char)
    n=len(frames_all)//2; samples=struct.unpack('<%dh'%n, frames_all)
    step=params.framerate//ENV_HZ; env=[]
    for i in range(0,n,step):
        chunk=samples[i:i+step]; rms=math.sqrt(sum(x*x for x in chunk)/max(1,len(chunk)))/32768
        env.append(rms)
    peak=max(env) or 1
    q=''.join('0123456789abcdefghijklmnopqrstuvwxyz'[min(35,int(35*(v/peak)**0.7))] for v in env)
    sector,screen=key.split('/')
    base=f'{sector}-{screen}'
    aif=os.path.join(S,'aud',base+'.wav')
    w=wave.open(aif,'wb'); w.setparams(params); w.writeframes(frames_all); w.close()
    subprocess.run(['afconvert','-f','m4af','-d','aac','-b','48000',aif,os.path.join(OUT,base+'.m4a')],check=True)
    data[key]={'src':base+'.m4a','dur':round(t0,2),'sents':timeline,'env':q}
    print(key, len(sents),'sentences', round(t0,1),'s')
json.dump(data,open(os.path.join(S,'timing.json'),'w'))
