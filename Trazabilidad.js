javascript:(async function() {
    var TIPOS_VALIDOS=["CAMBIO CM AVERIA BITSTREAM", "CAMBIO EQUIPO AVERIA FO LOWI", "CAMBIO EQUIPO AVERIA FTTH LOWI", "CAMBIO DECO LOWI"], SELECTOR_INPUT="#__input1-inner", SELECTOR_IR="#container-vodafonetrazabilidad---Home--filterBarHome-btnGo", SELECTOR_TABLA="#container-vodafonetrazabilidad---Home--idProductsTable", SELECTOR_PROCESSOR="#container-vodafonetrazabilidad---Detail--iconTabFilterProcessor-icon", SELECTOR_TABLA_HISTORIAL="#container-vodafonetrazabilidad---Detail--historyDetailTable-listUl", XPATH_TABLA_ESTADOS="/html/body/div[2]/div/div/div/div/div[2]/div[3]/div/div/div/div/article/div/div[2]/div/div/div/div/div[2]/div/div/div/div/table", XPATH_MENSAJE="/html/body/div[1]/div[3]", XPATH_OK="/html/body/div[1]/div[3]/div[3]/div/button[1]", OTS=[], resultados=[], errores=[], contadorProceso=null;function obtenerXPath(xpath) {
        try {
            return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        }
        catch(e) {
            return null
        }
    }
    function hacerClick(elemento) {
        if(!elemento)return;["pointerdown", "mousedown", "mouseup", "click"].forEach(function(evento) {
            elemento.dispatchEvent(new MouseEvent(evento, {
                bubbles:true, cancelable:true, view:window
            }
            ))
        }
        )
    }
    function comprobarSinResultados() {
        var mensaje=obtenerXPath(XPATH_MENSAJE);if(!mensaje)return false;var texto=(mensaje.innerText||mensaje.textContent||"").trim().toUpperCase();if(texto.includes("NO SE HAN ENCONTRADO RESULTADOS")) {
            var boton=obtenerXPath(XPATH_OK);if(boton) {
                hacerClick(boton);return true
            }
        }
        return false
    }
    function crearContadorProceso(total) {
        if(contadorProceso)contadorProceso.remove();contadorProceso=document.createElement("div");contadorProceso.id="trazabilidad-masiva-contador";Object.assign(contadorProceso.style, {
            position:"fixed", top:"20px", right:"20px", width:"310px", maxHeight:"500px", overflowY:"auto", background:"#fff", borderRadius:"10px", padding:"15px", boxShadow:"0 5px 25px rgba(0,0,0,.3)", zIndex:"9999999", fontFamily:"Arial,sans-serif", border:"1px solid #ddd"
        }
        );document.body.appendChild(contadorProceso);actualizarContadorProceso(0, total, 0, 0, "", "Preparando proceso...")
    }
    function actualizarContadorProceso(procesadas, total, correctas, erroresCount, otActual, estado) {
        if(!contadorProceso)return;var porcentaje=total>0?Math.round(procesadas/total*100):0;var listaErrores="";if(errores.length>0) {
            listaErrores='<div style="margin-top:10px;border-top:1px solid #ddd;padding-top:8px"><div style="font-size:13px;font-weight:bold;color:#c00;margin-bottom:5px">? OTs con error:</div>';for(var i=0;i<errores.length;i++)listaErrores+='<div style="font-size:12px;color:#c00;margin:2px 0">• '+errores[i].ot+"</div>";listaErrores+="</div>"
        }
        contadorProceso.innerHTML='<div style="font-size:16px;font-weight:bold;margin-bottom:10px">TRAZABILIDAD MASIVA</div><div style="font-size:14px;margin-bottom:8px"><b>Progreso:</b> '+procesadas+" / "+total+" ("+porcentaje+'%)</div><div style="width:100%;height:10px;background:#e5e5e5;border-radius:5px;overflow:hidden;margin-bottom:10px"><div style="width:'+porcentaje+'%;height:100%;background:#0078d4;transition:width .2s"></div></div><div style="font-size:13px;margin-bottom:5px">? Correctas: <b>'+correctas+'</b></div><div style="font-size:13px;margin-bottom:8px">? Errores: <b>'+erroresCount+'</b></div><div style="font-size:12px;color:#555;margin-bottom:4px"><b>OT actual:</b> '+(otActual||"-")+'</div><div style="font-size:12px;color:#666">'+estado+"</div>"+listaErrores
    }
    function finalizarContadorProceso() {
        if(!contadorProceso)return;actualizarContadorProceso(OTS.length, OTS.length, resultados.length, errores.length, "", "PROCESO FINALIZADO");contadorProceso.style.border=errores.length===0?"2px solid #28a745":"2px solid #dc3545"
    }
    function solicitarOTs() {
        return new Promise(function(resolve) {
            var overlay=document.createElement("div");overlay.id="trazabilidad-masiva-overlay";Object.assign(overlay.style, {
                position:"fixed", top:"0", left:"0", width:"100%", height:"100%", background:"rgba(0,0,0,.55)", zIndex:"999999"
            }
            );var ventana=document.createElement("div");Object.assign(ventana.style, {
                position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"520px", background:"#fff", borderRadius:"10px", padding:"25px", boxShadow:"0 10px 40px rgba(0,0,0,.35)", fontFamily:"Arial,sans-serif"
            }
            );var titulo=document.createElement("div");titulo.innerText="TRAZABILIDAD MASIVA";Object.assign(titulo.style, {
                fontSize:"20px", fontWeight:"bold", marginBottom:"10px"
            }
            );var descripcion=document.createElement("div");descripcion.innerText="Pega aquí el listado de OTs. Puedes copiarlo directamente desde Excel o utilizar una lista con una OT por línea.";Object.assign(descripcion.style, {
                fontSize:"13px", color:"#555", marginBottom:"12px", lineHeight:"1.5"
            }
            );var textarea=document.createElement("textarea");textarea.placeholder="Ejemplo:\n607992341\n607987603\n607987909\n607999108";Object.assign(textarea.style, {
                width:"100%", height:"180px", boxSizing:"border-box", resize:"vertical", padding:"10px", border:"1px solid #bbb", borderRadius:"6px", fontSize:"14px", fontFamily:"Consolas,monospace"
            }
            );var contador=document.createElement("div");contador.innerText="OTs detectadas: 0";Object.assign(contador.style, {
                fontSize:"12px", color:"#666", marginTop:"8px"
            }
            );var botones=document.createElement("div");Object.assign(botones.style, {
                display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"18px"
            }
            );var cancelar=document.createElement("button");cancelar.innerText="Cancelar";Object.assign(cancelar.style, {
                padding:"9px 18px", border:"1px solid #aaa", borderRadius:"6px", background:"#fff", cursor:"pointer"
            }
            );var iniciar=document.createElement("button");iniciar.innerText="Iniciar proceso";Object.assign(iniciar.style, {
                padding:"9px 18px", border:"none", borderRadius:"6px", background:"#0078d4", color:"#fff", cursor:"pointer", fontWeight:"bold"
            }
            );function obtenerOTsDesdeTexto(texto) {
                var lineas=texto.split(/\r?\n/), lista=[];for(var i=0;i<lineas.length;i++) {
                    var linea=lineas[i].trim().replace(/\|/g, "").replace(/%60/g, "").trim();if(!linea||/^[-\s]+$/.test(linea))continue;var coincidencias=linea.match(/\b\d{9}\b/g);if(!coincidencias)continue;for(var j=0;j<coincidencias.length;j++) {
                        var ot=coincidencias[j];if(!lista.includes(ot))lista.push(ot)
                    }
                }
                return lista
            }
            function actualizarContador() {
                contador.innerText="OTs detectadas: "+obtenerOTsDesdeTexto(textarea.value).length
            }
            textarea.addEventListener("input", actualizarContador);cancelar.onclick=function() {
                overlay.remove();resolve([])
            };iniciar.onclick=function() {
                var lista=obtenerOTsDesdeTexto(textarea.value);if(!lista.length) {
                    alert("No se encontraron OTs válidas.\n\nIntroduce OTs de 9 dígitos.");return
                }
                overlay.remove();resolve(lista)
            };botones.appendChild(cancelar);botones.appendChild(iniciar);ventana.appendChild(titulo);ventana.appendChild(descripcion);ventana.appendChild(textarea);ventana.appendChild(contador);ventana.appendChild(botones);overlay.appendChild(ventana);document.body.appendChild(overlay);textarea.focus()
        }
        )
    }
    function esperarElemento(selector, tiempo) {
        return new Promise(function(resolve, reject) {
            var inicio=Date.now(), intervalo=setInterval(function() {
                if(comprobarSinResultados()) {
                    clearInterval(intervalo);reject(new Error("No se encontraron resultados para los filtros aplicados."));return
                }
                var elemento=document.querySelector(selector);if(elemento) {
                    clearInterval(intervalo);resolve(elemento);return
                }
                if(Date.now()-inicio>=tiempo) {
                    clearInterval(intervalo);reject(new Error("No se encontró el elemento: "+selector))
                }
            }, 150)
        }
        )
    }
    function escribirInput(input, valor) {
        var descriptor=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");input.focus();if(descriptor&&descriptor.set)descriptor.set.call(input, "");else input.value="";input.dispatchEvent(new Event("input", {
            bubbles:true
        }
        ));if(descriptor&&descriptor.set)descriptor.set.call(input, valor);else input.value=valor;input.dispatchEvent(new Event("input", {
            bubbles:true
        }
        ));input.dispatchEvent(new Event("change", {
            bubbles:true
        }
        ))
    }
    function obtenerFilas() {
        var tabla=document.querySelector(SELECTOR_TABLA);if(!tabla)return[];var celdas=tabla.querySelectorAll('[id*="-rows-row"][id*="-col"]'), filas= {
        };for(var i=0;i<celdas.length;i++) {
            var celda=celdas[i], coincidencia=celda.id.match(/-rows-(row\d+)-col\d+/);if(!coincidencia)continue;var numeroFila=coincidencia[1];if(!filas[numeroFila])filas[numeroFila]= {
                elementos:[], texto:""
            };var textoCelda=celda.innerText.trim();filas[numeroFila].elementos.push(celda);if(textoCelda)filas[numeroFila].texto+=" "+textoCelda
        }
        return Object.keys(filas).map(function(numeroFila) {
            return {
                numero:numeroFila, elementos:filas[numeroFila].elementos, texto:filas[numeroFila].texto.trim()
            }
        }
        )
    }
    function buscarFilaCorrecta(otBuscada) {
        var filas=obtenerFilas();for(var i=0;i<filas.length;i++) {
            var fila=filas[i], texto=fila.texto.toUpperCase();if(!texto.includes(otBuscada))continue;for(var j=0;j<TIPOS_VALIDOS.length;j++) {
                var tipo=TIPOS_VALIDOS[j];if(texto.includes(tipo))return {
                    fila:fila, tipo:tipo
                }
            }
        }
        return null
    }
    function esperarFilaCorrecta(ot, tiempo) {
        return new Promise(function(resolve, reject) {
            var inicio=Date.now(), intervalo=setInterval(function() {
                if(comprobarSinResultados()) {
                    clearInterval(intervalo);reject(new Error("No se encontraron resultados para los filtros aplicados."));return
                }
                var resultado=buscarFilaCorrecta(ot);if(resultado) {
                    clearInterval(intervalo);resolve(resultado);return
                }
                if(Date.now()-inicio>=tiempo) {
                    clearInterval(intervalo);reject(new Error("No se encontró la OT "+ot+" con una tipología de cambio válida."))
                }
            }, 150)
        }
        )
    }
    function obtenerTablaTrazabilidad() {
        var resultadoXPath=document.evaluate(XPATH_TABLA_ESTADOS, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);if(resultadoXPath.singleNodeValue)return resultadoXPath.singleNodeValue;var contenedor=document.querySelector(SELECTOR_TABLA_HISTORIAL);if(contenedor) {
            var tabla=contenedor.querySelector("table");if(tabla)return tabla;if(contenedor.tagName&&contenedor.tagName.toLowerCase()==="table")return contenedor
        }
        return null
    }
    function esperarTablaTrazabilidad(tiempo) {
        return new Promise(function(resolve, reject) {
            var inicio=Date.now(), intervalo=setInterval(function() {
                if(comprobarSinResultados()) {
                    clearInterval(intervalo);reject(new Error("No se encontraron resultados para los filtros aplicados."));return
                }
                var tabla=obtenerTablaTrazabilidad();if(tabla) {
                    var filas=tabla.querySelectorAll("tr");if(filas.length>1) {
                        clearInterval(intervalo);resolve(tabla);return
                    }
                }
                if(Date.now()-inicio>=tiempo) {
                    clearInterval(intervalo);reject(new Error("No se encontró la tabla de estados logísticos."))
                }
            }, 150)
        }
        )
    }
    function extraerPrimerEstado(ot) {
        const tabla = obtenerTablaTrazabilidad();
        if (!tabla) throw new Error("No se encontró la tabla de estados.");
        const filas = tabla.querySelectorAll("tr");
        for (let i = 0; i < filas.length; i++) {
            const celdas = filas[i].querySelectorAll("td");
            if (celdas.length < 4) continue;
            const valores = Array.from(celdas).map(celda => celda.innerText.trim());
            let indiceFecha = -1;
            for (let k = 0; k < valores.length; k++) {
                if (/^\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{4}$/.test(valores[k])) {
                    indiceFecha = k;
                    break;
                }
            }
            const indiceHora =
            indiceFecha >= 0 &&
            valores[indiceFecha + 1] &&
            /^\\d{1,2}:\\d{2}:\\d{2}$/.test(valores[indiceFecha + 1])
            ? indiceFecha + 1
            : -1;
            if (indiceFecha >= 2 && indiceHora >= 0) {
                let estadoLogistico = valores[indiceFecha - 2];
                let descripcion = valores[indiceFecha - 1];
                if (valores.length >= 5 && valores[0] === "") {
                    estadoLogistico = valores[1];
                    descripcion = valores[2];
                }
                return {
                    numeroOrden: ot,
                    estadoLogistico,
                    descripcion,
                    fechaEstado: valores[indiceFecha],
                    horaEstado: valores[indiceHora]
                };
            }
        }
        throw new Error("No fue posible identificar el estado logístico.");
    }
    function extraerTodosEstados(ot) {
        const tabla = obtenerTablaTrazabilidad();
        if (!tabla) throw new Error("No se encontró la tabla de estados.");
        const filas = tabla.querySelectorAll("tr");
        const estados = [];
        for (let i = 0; i < filas.length; i++) {
            const celdas = filas[i].querySelectorAll("td");
            if (celdas.length < 4) continue;
            const valores = Array.from(celdas).map(celda => celda.innerText.trim());
            let indiceFecha = -1;
            for (let k = 0; k < valores.length; k++) {
                if (/^\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{4}$/.test(valores[k])) {
                    indiceFecha = k;
                    break;
                }
            }
            const indiceHora =
            indiceFecha >= 0 &&
            valores[indiceFecha + 1] &&
            /^\\d{1,2}:\\d{2}:\\d{2}$/.test(valores[indiceFecha + 1])
            ? indiceFecha + 1
            : -1;
            if (indiceFecha >= 2 && indiceHora >= 0) {
                let estadoLogistico = valores[indiceFecha - 2];
                let descripcion = valores[indiceFecha - 1];
                if (valores.length >= 5 && valores[0] === "") {
                    estadoLogistico = valores[1];
                    descripcion = valores[2];
                }
                estados.push( {
                    numeroOrden: ot,
                    estadoLogistico,
                    descripcion,
                    fechaEstado: valores[indiceFecha],
                    horaEstado: valores[indiceHora]
                }
                );
            }
        }
        return estados;
    }
    function generarTXT(datos) {
        let contenido = "VALIDACION TRAZABILIDAD:\n\n";
        for (const grupo of datos) {
            contenido += "NUMERO DE OT: " + grupo.numeroOrden + "\n\n";
            contenido += "SITUACION".padEnd(15);
            contenido += "DESCRIPCIÓN".padEnd(30);
            contenido += "FECHA DE ESTADO".padEnd(20);
            contenido += "HORA DE ESTADO\n";
            contenido += "-".repeat(85) + "\n";
            for (const estado of grupo.estados) {
                contenido += String(estado.estadoLogistico || "").padEnd(15);
                contenido += String(estado.descripcion || "").padEnd(30);
                contenido += String(estado.fechaEstado || "").padEnd(20);
                contenido += String(estado.horaEstado || "") + "\n";
            }
            contenido += "\n";
        }
        const blob = new Blob([contenido], {
            type: "text/plain;charset=utf-8"
        }
        );
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        const fecha = new Date();
        enlace.href = url;
        enlace.download =
        "Trazabilidad_Completa_" +
        String(fecha.getDate()).padStart(2, "0") +
        "-" +
        String(fecha.getMonth() + 1).padStart(2, "0") +
        "-" +
        fecha.getFullYear() +
        ".txt";
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        setTimeout(() => URL.revokeObjectURL(url), 500);
    }
    function volverAConsulta() {
        var inputActual=document.querySelector(SELECTOR_INPUT);if(inputActual)return Promise.resolve(inputActual);window.history.back();return esperarElemento(SELECTOR_INPUT, 10000)
    }
    function escaparHTML(valor) {
        return String(valor||"").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
    }
    function generarXLS(datos) {
        var html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><style>table{border-collapse:collapse}th{font-weight:bold;background:#D9EAF7}th,td{border:1px solid #000;padding:5px}</style></head><body><table><tr><th>Numero de orden</th><th>Estado logistico</th><th>Descripcion</th><th>Fecha de Estado</th><th>Hora de Estado</th></tr>';for(var i=0;i<datos.length;i++) {
            var fila=datos[i];html+="<tr><td>"+escaparHTML(fila.numeroOrden)+"</td><td>"+escaparHTML(fila.estadoLogistico)+"</td><td>"+escaparHTML(fila.descripcion)+"</td><td>"+escaparHTML(fila.fechaEstado)+"</td><td>"+escaparHTML(fila.horaEstado)+"</td></tr>"
        }
        html+="</table></body></html>";var blob=new Blob(["\ufeff", html], {
            type:"application/vnd.ms-excel;charset=utf-8;"
        }
        ), url=URL.createObjectURL(blob), enlace=document.createElement("a"), fecha=new Date(), dia=String(fecha.getDate()).padStart(2, "0"), mes=String(fecha.getMonth()+1).padStart(2, "0"), anio=fecha.getFullYear(), nombreArchivo="Trazabilidad_Logistica_"+dia+"-"+mes+"-"+anio+".xls";enlace.href=url;enlace.download=nombreArchivo;document.body.appendChild(enlace);enlace.click();document.body.removeChild(enlace);setTimeout(function() {
            URL.revokeObjectURL(url)
        }, 500)
    }
    async function procesarOT(ot, indice) {
        actualizarContadorProceso(indice, OTS.length, resultados.length, errores.length, ot, "Buscando OT...");var input=await esperarElemento(SELECTOR_INPUT, 10000);escribirInput(input, ot);await new Promise(function(resolve) {
            setTimeout(resolve, 150)
        }
        );var boton=await esperarElemento(SELECTOR_IR, 10000);hacerClick(boton);actualizarContadorProceso(indice, OTS.length, resultados.length, errores.length, ot, "Cargando resultados...");await esperarElemento(SELECTOR_TABLA, 10000);var resultado=await esperarFilaCorrecta(ot, 10000);actualizarContadorProceso(indice, OTS.length, resultados.length, errores.length, ot, "Tipología encontrada: "+resultado.tipo);var celdaOT=null;for(var i=0;i<resultado.fila.elementos.length;i++) {
            var elemento=resultado.fila.elementos[i];if(elemento.innerText.trim()===ot) {
                celdaOT=elemento;break
            }
        }
        if(!celdaOT)celdaOT=document.querySelector("#container-vodafonetrazabilidad---Home--idProductsTable-rows-"+resultado.fila.numero+"-col1");if(!celdaOT)throw new Error("No se encontró la celda de la OT.");hacerClick(celdaOT);actualizarContadorProceso(indice, OTS.length, resultados.length, errores.length, ot, "Abriendo detalle...");var processor=await esperarElemento(SELECTOR_PROCESSOR, 10000);hacerClick(processor);await new Promise(function(resolve) {
            setTimeout(resolve, 200)
        }
        );actualizarContadorProceso(indice, OTS.length, resultados.length, errores.length, ot, "Consultando trazabilidad...");await esperarTablaTrazabilidad(10000);
        const primerEstado = extraerPrimerEstado(ot);
        primerEstado.estados = extraerTodosEstados(ot);
        return primerEstado
    }
    OTS=await solicitarOTs();if(OTS.length===0)return;crearContadorProceso(OTS.length);console.clear();console.log("TRAZABILIDAD MASIVA");console.log("OTs detectadas: "+OTS.length);for(var i=0;i<OTS.length;i++) {
        var ot=OTS[i];try {
            var resultado=await procesarOT(ot, i);resultados.push(resultado);actualizarContadorProceso(i+1, OTS.length, resultados.length, errores.length, ot, "? OT procesada correctamente")
        }
        catch(error) {
            console.error("ERROR EN OT "+ot, error.message);errores.push( {
                ot:ot, error:error.message
            }
            );actualizarContadorProceso(i+1, OTS.length, resultados.length, errores.length, ot, "? OT con error: "+error.message)
        }
        if(i<OTS.length-1) {
            actualizarContadorProceso(i+1, OTS.length, resultados.length, errores.length, ot, "Preparando siguiente OT...");try {
                await volverAConsulta()
            }
            catch(errorRegreso) {
                console.error("Error al regresar a consulta después de "+ot, errorRegreso.message);try {
                    await new Promise(function(resolve) {
                        setTimeout(resolve, 500)
                    }
                    );if(!document.querySelector(SELECTOR_INPUT)) {
                        window.history.back();await esperarElemento(SELECTOR_INPUT, 10000)
                    }
                }
                catch(errorRecuperacion) {
                    console.error("No se pudo recuperar la pantalla de consulta para "+ot, errorRecuperacion.message)
                }
            }
            await new Promise(function(resolve) {
                setTimeout(resolve, 300)
            }
            )
        }
    }
    finalizarContadorProceso();console.log("PROCESO FINALIZADO");console.log("OTs recibidas: "+OTS.length);console.log("OTs procesadas: "+resultados.length);console.log("OTs con error: "+errores.length);console.log("CONTROL FINAL: "+(resultados.length+errores.length)+" / "+OTS.length);if(resultados.length>0) {
        console.table(resultados);generarXLS(resultados);
        generarTXT(resultados)
    }
    if(errores.length>0) {
        console.log("ERRORES");console.table(errores)
    }
}
)();
