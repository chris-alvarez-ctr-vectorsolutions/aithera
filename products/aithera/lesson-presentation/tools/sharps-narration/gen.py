"""Build the Sharps Listen-carrier audio (placeholder voices).

  cd products/aithera/lesson-presentation
  bash tools/sharps-narration/build.sh

1. extract.js pulls every screen's podcast script (PODCAST in
   js/layered-sharps.js — Jessica's two-host cut) into <work>/narr.json.
2. This script voices it sentence by sentence with macOS `say`, one voice per
   speaker (VOICES), into one AAC file per screen in assets/audio/sharps/,
   and records sentence timings (with the speaker, `w`) + a 30 Hz loudness
   envelope. Sentences within a turn are 0.32s apart, turns 0.5s, and the
   script's own (pause) is 1.2s of silence.
3. build.sh writes those into js/sharps-narration.js (window.SHARPS_NARRATION).
Bump sharps-narration.js?v= in clara/sharps.html afterwards.
"""
import json, re, subprocess, wave, struct, math, os, sys
S=sys.argv[2] if len(sys.argv)>2 else '/tmp/sharps-narration'; OUT=sys.argv[1]
os.makedirs(os.path.join(S,'aud'),exist_ok=True)
narr=json.load(open(os.path.join(S,'narr.json')))
VOICES={'DANA':'Samantha','RAY':'Reed (English (US))','JACOB':'Eddy (English (US))'}
SPLIT=re.compile(r'(?<=[.?!”])\s+(?=[A-Z“"])')
GAP=0.32; TURN=0.5; PAUSE=1.2; ENV_HZ=30; FMT='LEI16@22050'
data={}
for key, lines in narr.items():
    frames_all=b''; params=None; timeline=[]; t0=0.0
    def silence(sec):
        global frames_all, t0
        frames_all+=b'\x00\x00'*int(sec*22050); t0+=sec
    for li,line in enumerate(lines):
        if line[0]=='PAUSE':
            silence(PAUSE); continue
        who,text=line
        if li>0: silence(TURN)
        sents=[t for t in SPLIT.split(text.strip()) if t]
        for si,t in enumerate(sents):
            if si>0: silence(GAP)
            f=os.path.join(S,'aud','tmp.wav')
            subprocess.run(['say','-v',VOICES[who],'-o',f,'--file-format=WAVE','--data-format='+FMT,t],check=True)
            a=wave.open(f,'rb'); params=a.getparams(); fr=a.readframes(a.getnframes()); a.close()
            dur=len(fr)/2/params.framerate
            timeline.append({'p':li,'w':who,'t':t,'s':round(t0,3),'e':round(t0+dur,3)})
            frames_all+=fr; t0+=dur
    silence(GAP)
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
    wav=os.path.join(S,'aud',base+'.wav')
    w=wave.open(wav,'wb'); w.setparams(params); w.writeframes(frames_all); w.close()
    subprocess.run(['afconvert','-f','m4af','-d','aac','-b','48000',wav,os.path.join(OUT,base+'.m4a')],check=True)
    data[key]={'src':base+'.m4a','dur':round(t0,2),'sents':timeline,'env':q}
    print(key, len(timeline),'sentences', round(t0,1),'s')
json.dump(data,open(os.path.join(S,'timing.json'),'w'))
