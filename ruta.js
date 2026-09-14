(async function(){

// Cargar agentes desde GitHub
const respuesta = await fetch(
"https://cdn.jsdelivr.net/gh/Lowi2026/AUTOMALOW@main/agentes.json?v="+Date.now()
);

const db = await respuesta.json();


const b=prompt("BSM:");

if(db[b]){

const d=db[b];

const h=new Date();

const f=`${h.getDate()}/${h.getMonth()+1}/${h.getFullYear()}`;

const w=(m)=>new Promise(r=>setTimeout(r,m));


const sf=(i,v)=>{

const n=document.querySelectorAll(
'input[data-automation-id="textInput"]'
);

if(n[i]){

n[i].value=v;

n[i].dispatchEvent(
new Event('input',{bubbles:true})
);

}

};


const ct=async(t)=>{

const l=Array.from(
document.querySelectorAll(
'label span, .text-format-content, span'
)
);


const g=l.find(
e=>e.textContent.trim()===t
);


if(g){

g.click();

await w(350);

}

};



await ct("SÍ");

sf(0,b);



const di=document.querySelector(
'input[data-is-focusable="true"]'
);


if(di){

di.value=f;

di.dispatchEvent(
new Event('input',{bubbles:true})
);

}



await ct("Agregar programación");

await ct("OffShore");


sf(1,"30054000021");

sf(2,d.nombre);

sf(3,d.correo);

sf(4,d.tel);



await ct("BOGOTÁ");

await ct("ZF LOTE 35");


sf(5,d.loc);

sf(6,d.barrio);

sf(7,d.dir);

sf(8,d.hora);



alert("Listo: "+d.nombre);



}else{


alert("BSM no encontrado");


}



})();
