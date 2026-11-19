import React from 'react';

export const T = {
  bg: '#0f0b06',
  bgCard: '#1a1510',
  bgLight: '#2a2218',
  bgDark: '#0a0804',
  gold: '#c9a84c',
  goldDim: '#8a7030',
  goldBright: '#e8cc5c',
  text: '#e0d4b8',
  textDim: '#9a8e78',
  textBright: '#f4ecd8',
  purple: '#9a8aed',
  red: '#e05555',
  green: '#4aaa65',
  blue: '#6a9aec',
  orange: '#e8a040',
};

export const S = {
  panel: {
    background: T.bgDark,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    border: '1px solid ' + T.goldDim + '33',
  } as React.CSSProperties,
  tag: {
    fontSize: 10,
    fontWeight: 700 as const,
    color: T.goldDim,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  btn: {
    background: 'linear-gradient(135deg,' + T.gold + ',' + T.goldDim + ')',
    color: T.bgDark,
    border: 'none',
    borderRadius: 10,
    padding: '14px',
    fontSize: 14,
    fontWeight: 800,
  } as React.CSSProperties,
};

export const GCSS = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:sohne-var,system-ui,-apple-system,sans-serif;background:${T.bg};overflow-wrap:break-word;word-break:break-word}
div,span,p{overflow-wrap:break-word}
button{font-family:inherit;cursor:pointer}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${T.goldDim};border-radius:3px}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes diceRoll{0%{transform:rotate(0deg) scale(1)}25%{transform:rotate(90deg) scale(1.1)}50%{transform:rotate(180deg) scale(1)}75%{transform:rotate(270deg) scale(1.1)}100%{transform:rotate(360deg) scale(1)}}
`;
