#!/bin/node

import fetch from 'node-fetch';
import clipboardy from 'clipboardy';
import { HtmlNode } from './html.js';


let content = clipboardy.readSync()
  .replace(/[()<>]/g, ' ')
  .trim()
  .replace(/\n+/g, '\n')
  .replace(/\n/g, '<br></br>');

if (!content) {
  process.exit(1);
}

let body = [
  "FunctionName=GetTextSolution",
  "texteHTML=" + encodeURIComponent(`[[[PARTTEXT]]]p0;p26;[[[TEXT]]]<p>${content}</p>`),
  "texteStat=",
  "IdMax=56",
  "IdMaxSousGroupeRep=0",
  "writeRequest=false",
  "cntRequest30=1",
  "firstRequest=false",
  "progression=false",
  "charPrecPh=-1",
  "optionsCor="  + encodeURIComponent( "Genre_Je:0|Genre_Tu:0|Genre_Nous:0|Genre_Vous:0|Genre_On:0|RefOrth:0|ShowUPSol:1"),
  "optionsStyle=" + encodeURIComponent("RepMin:3|GapRep:3|AllWords:0|FamilyWords:0|MinPhLg:30|MinPhCt:5|Ttr:250|Tts:150"),
  "ensIdRepetitions=",
  "ensIdRepetitions2mPh=",
  "corSt=false",
  "plugin=false",
  "identifier=",
  "password=",
  "langId=fr",
  "isSampleText=false",
  "modePlugin=null",
].join('&&');



fetch("https://www.scribens.fr/Scribens/TextSolution_Servlet", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,fr;q=0.8",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  },
  "body": body,
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
})
.then(res => {
  return res.json();
})
.then(res => {
  let html = res.VectPartText.map(e => e.TexteHtML).join('');

  const node = new HtmlNode(`<div>${html}</div>`);
  node.decodeSpecial();

  const replacements = [];
  Object.values(res.SolutionCor.MapMotSolution).forEach((repl: any) => {
    replacements.push({
      id: repl.Id,
      explication: repl.ExplicationSolution,
      solutions: repl.vectSolution
    })
  });

  if (replacements.length === 1) {
    const repl = replacements[0];
    const elem = node.getNodeById(repl.id);
    if (!elem) { return }
    for (const sol of repl.solutions) {
      elem.innerHTML = sol.Left;
      elem.decodeSpecial();
      console.log(node.innerText);
      clipboardy.writeSync(node.innerText);
    }
  } else {
    replacements.forEach(repl => {
      const elem = node.getNodeById(repl.id);
      if (!elem) {
        console.log(repl.id);
        return;
      }
      for (const sol of repl.solutions)
        elem.innerHTML = sol.Left;
    });
    node.decodeSpecial();
    console.log(node.innerText);
    clipboardy.writeSync(node.innerText);
  }
});
