import React from 'react';
export type EmbeddedProps={url?:string;html?:string;bootstrap?:string;onError?:()=>void;onNavigate?:(url:string)=>void};
export default function Embedded({url,html,onError}:EmbeddedProps){return React.createElement('iframe',{title:'Odoe workspace',src:html?undefined:url,srcDoc:html,allow:'fullscreen; autoplay; encrypted-media; payment; camera; microphone',allowFullScreen:true,onError,style:{border:0,width:'100%',height:'100%',flex:1,background:'#071525'}});}
