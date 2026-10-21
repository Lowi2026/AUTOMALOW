(async function(){

const b=prompt("BMS:")?.trim();

if(!b){
alert("Ingresa un BMS para buscar.");
return;
}

const supabaseUrl="https://gjchhoraaukfaumzcwnd.supabase.co";
const supabaseKey="sb_publishable_3AVUNcIiNxzTMAhDnvon1Q_GMBwjSW3";

try{
const endpoint=new URL("/rest/v1/head_count",supabaseUrl);
endpoint.search=new URLSearchParams({
select:"nombre_completo,mail,tel_movil,localidad,barrio,direccion",
bms:`eq.${b}`,
limit:"1"
}).toString();

const response=await fetch(endpoint,{
headers:{
apikey:supabaseKey,
Authorization:`Bearer ${supabaseKey}`
}
});

if(!response.ok){
const detail=await response.text();
throw new Error(`${response.status} ${detail}`);
}

const rows=await response.json();
const data=rows[0]??null;

if(data){

const d={
nombre:data.nombre_completo,
correo:data.mail,
tel:data.tel_movil,
loc:data.localidad,
barrio:data.barrio,
dir:data.direccion,
hora:""
};

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


 alert(`No se encontró el BMS ${b} entre los registros visibles. Verifica el valor y los permisos SELECT de RLS.`);


}

}catch(error){
console.error("Error consultando head_count en Supabase:",error);
alert("No se pudo consultar head_count en Supabase: "+error.message);
}



})();
