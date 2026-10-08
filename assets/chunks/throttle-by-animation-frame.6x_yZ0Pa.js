import{w as e}from"./raf.BxTc1jxX.js";function u(r){let t=null;const a=l=>()=>{t=null,r(...l)},n=(...l)=>{t===null&&(t=e(a(l)))};return n.cancel=()=>{t!==null&&e.cancel(t),t=null},n}export{u as t};
