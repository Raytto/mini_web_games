// Single-note teaching arrangements. Durations are beats, not tap deadlines.
export const noteNumber = text => {
  const m = /^([A-G])(#?)([4-6])$/.exec(text);
  if (!m) throw new Error('Invalid note: ' + text);
  return (Number(m[3]) + 1) * 12 + {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]] + (m[2] ? 1 : 0);
};
const score = text => text.trim().split(/\s+/).filter(t => t !== '|').map(token => {
  const [pitch, length = '1'] = token.split(':');
  return {midi:noteNumber(pitch), beats:Number(length)};
});
export const SONGS = [
  {id:'twinkle',zh:'小星星',en:'Twinkle, Twinkle',icon:'✦',bpm:92,kind:'song',credit:'Traditional French melody, Ah! vous dirai-je, maman (18th century). Original simple melody arrangement.',source:'https://www.merriammusic.com/school-of-music/piano-lessons/twinkle-twinkle-little-star/',notes:score('C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2')},
  {id:'mary',zh:'玛丽有只小羊',en:'Mary Had a Little Lamb',icon:'☁',bpm:100,kind:'song',credit:'Traditional nursery melody. Original simple melody arrangement.',source:'https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fdemo%2FTunes%2FMaryHadALittleLamb%2F0000',notes:score('E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2 E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4:4')},
  {id:'frere',zh:'两只老虎',en:'Frère Jacques',icon:'☀',bpm:94,kind:'song',credit:'Traditional French round, Frère Jacques. Original simple melody arrangement.',source:'https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fmirror%2Fwprj.net%2Ftunes%2FFrere_Jacques%2F0000',notes:score('C5 D5 E5 C5 C5 D5 E5 C5 E5 F5 G5:2 E5 F5 G5:2 G5:0.5 A5:0.5 G5:0.5 F5:0.5 E5 C5 G5:0.5 A5:0.5 G5:0.5 F5:0.5 E5 C5 C5 G4 C5:2 C5 G4 C5:2')},
  {id:'jingle',zh:'铃儿响叮当',en:'Jingle Bells',icon:'♧',bpm:112,kind:'chorus',credit:'James Lord Pierpont, The One Horse Open Sleigh (1857). Chorus, original single-note teaching arrangement.',source:'https://www.loc.gov/item/2023812429/',notes:score('E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:0.5 E4:4 F4 F4 F4:1.5 F4:0.5 F4 E4 E4 E4:0.5 E4:0.5 E4 D4 D4 E4 D4:2 G4:2 E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:0.5 E4:4 F4 F4 F4:1.5 F4:0.5 F4 E4 E4 E4:0.5 E4:0.5 G4 G4 F4 D4 C4:4')},
  {id:'joy',zh:'欢乐颂',en:'Ode to Joy',icon:'♡',bpm:100,kind:'theme',credit:'Ludwig van Beethoven, Symphony No. 9 (1824), main theme. Transposed to C; original single-note teaching arrangement.',source:'https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fmirror%2Ftroseandassociates.com%2Fabc%2FOde_To_Joy%2F0002',notes:score('E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:0.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2')},
  {id:'castle',zh:'天空之城',en:'Castle in the Sky',icon:'☁',bpm:92,kind:'excerpt',credit:'Joe Hisaishi, Kimi wo Nosete. Brief opening learning excerpt only (13 notes); no full score or lyrics redistributed.',source:'https://doc.xuehai.net/b6900ab34c23a1f1345ca6f4a.html',notes:score('A4:0.5 B4:0.5 C5:1.5 B4:0.5 C5 E5 B4:3 E4 A4:1.5 G4:0.5 A4 C5 G4:3')},
  {id:'smurfs',zh:'蓝精灵',en:'The Smurfs · Chinese theme',icon:'♫',bpm:112,kind:'excerpt',credit:'Zheng Qiufeng (郑秋枫), 蓝精灵之歌. Brief opening vocal phrase only (10 notes); no lyrics or full score redistributed.',source:'https://www.qupu123.com/shaoer/wuzi/p22879.html',notes:score('E4:0.5 F4:0.5 G4:0.5 F4:0.5 E4:0.5 F4:0.5 G4:0.5 F4:0.5 E4:0.5 F4:1.5')},
  {id:'raindrops',zh:'黑键小雨滴',en:'Black-key Raindrops',icon:'•',bpm:80,kind:'song',credit:'Original pentatonic exercise for Xiaoxiao Little Piano, 2026. Five black keys.',source:null,notes:score('C#4 D#4 F#4:2 D#4 C#4:2 F#4 G#4 A#4:2 G#4 F#4:2 D#4 F#4 G#4 D#4 C#4:3')}
];
for (const s of SONGS) if (s.notes.some(n => n.midi < 60 || n.midi > 84 || !(n.beats > 0))) throw new Error('Score outside keyboard: ' + s.id);
