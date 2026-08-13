(function () {
    'use strict';

    // ============================================================
    // CONFIGURACIÓN
    // ============================================================

    const CONFIG = {
        ancho: '500px',
        altoTextarea: '190px',
        duracionToast: 3500
    };

    // ============================================================
    // ELIMINAR INSTANCIA ANTERIOR
    // ============================================================

    const anterior = document.getElementById(
        'bo-soporte-bookmarklet'
    );

    if (anterior) {
        anterior.remove();
    }

    // ============================================================
    // ESTILOS
    // ============================================================

    const estilo = document.createElement('style');

    estilo.id = 'bo-soporte-estilos';

    estilo.textContent = `
        #bo-soporte-bookmarklet * {
            box-sizing: border-box;
        }

        #bo-soporte-bookmarklet button {
            font-family: Segoe UI, Arial, sans-serif;
        }

        #bo-soporte-plantilla::placeholder {
            color: #777;
            opacity: 1;
        }

        #bo-soporte-plantilla:focus {
            border-color: #005E50 !important;
            box-shadow: 0 0 0 2px rgba(0,94,80,.10) !important;
        }

        @keyframes boEntrada {
            from {
                opacity: 0;
                transform: scale(.96) translateY(5px);
            }

            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        @keyframes boToastEntrada {
            from {
                opacity: 0;
                transform: translateY(15px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes boToastSalida {
            from {
                opacity: 1;
                transform: translateY(0);
            }

            to {
                opacity: 0;
                transform: translateY(15px);
            }
        }
    `;

    document.head.appendChild(estilo);

    // ============================================================
    // UTILIDADES
    // ============================================================

    function escaparHTML(texto) {

        return String(texto || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalizarTexto(texto) {

        return String(texto || '')
            .replace(/\u00A0/g, ' ')
            .replace(/\r/g, '')
            .trim();
    }

    // ============================================================
    // TOAST
    // ============================================================

    function mostrarToast(mensaje, tipo = 'ok') {

        const anterior =
            document.getElementById('bo-soporte-toast');

        if (anterior) {
            anterior.remove();
        }

        const toast =
            document.createElement('div');

        toast.id =
            'bo-soporte-toast';

        let icono = '?';
        let fondo = '#e5f7ef';
        let color = '#16804b';

        if (tipo === 'error') {
            icono = '?';
            fondo = '#ffe5e5';
            color = '#c62828';
        }

        if (tipo === 'warning') {
            icono = '?';
            fondo = '#fff3cd';
            color = '#9a6700';
        }

        toast.innerHTML = `
            <div class="bo-toast-icon">${icono}</div>
            <div class="bo-toast-text">
                ${escaparHTML(mensaje)}
            </div>
        `;

        Object.assign(toast.style, {
            position: 'fixed',
            right: '22px',
            bottom: '22px',
            zIndex: '2147483647',
            width: '320px',
            minHeight: '54px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,.20)',
            display: 'flex',
            alignItems: 'center',
            padding: '12px 15px',
            gap: '11px',
            fontFamily: 'Segoe UI, Arial, sans-serif',
            fontSize: '13px',
            color: '#222',
            border: '1px solid rgba(0,0,0,.08)',
            animation: 'boToastEntrada .35s ease forwards'
        });

        const icon =
            toast.querySelector('.bo-toast-icon');

        Object.assign(icon.style, {
            width: '28px',
            height: '28px',
            minWidth: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: fondo,
            color: color,
            fontWeight: '700',
            fontSize: '15px'
        });

        document.body.appendChild(toast);

        setTimeout(() => {

            toast.style.animation =
                'boToastSalida .35s ease forwards';

            setTimeout(() => {
                toast.remove();
            }, 350);

        }, CONFIG.duracionToast);
    }

    // ============================================================
    // OBTENER CAMPO
    // ============================================================

    function obtenerCampo(plantilla, nombre) {

        const regex = new RegExp(
            '^\\s*[•\\-]?\\s*' +
            nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
            '\\s*:\\s*(.*)$',
            'im'
        );

        const match =
            plantilla.match(regex);

        if (!match) {
            return '';
        }

        return normalizarTexto(match[1]);
    }

    // ============================================================
    // CAMPO MULTILÍNEA
    // ============================================================

    function extraerCampoMultilinea(
        plantilla,
        inicio,
        finales
    ) {

        const texto =
            normalizarTexto(plantilla);

        const regexInicio =
            new RegExp(
                '^\\s*[•\\-]?\\s*' +
                inicio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
                '\\s*:\\s*',
                'im'
            );

        const match =
            regexInicio.exec(texto);

        if (!match) {
            return '';
        }

        let contenido =
            texto.substring(
                match.index + match[0].length
            );

        const posiciones = [];

        finales.forEach(final => {

            const regexFinal =
                new RegExp(
                    '\\n\\s*[•\\-]?\\s*' +
                    final.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
                    '\\s*:',
                    'i'
                );

            const encontrado =
                regexFinal.exec(contenido);

            if (encontrado) {
                posiciones.push(
                    encontrado.index
                );
            }
        });

        if (posiciones.length) {

            contenido =
                contenido.substring(
                    0,
                    Math.min(...posiciones)
                );
        }

        return normalizarTexto(contenido);
    }

    // ============================================================
    // DETECTAR TIPO DE PLANTILLA
    // ============================================================

    function detectarPlantilla(plantilla) {

        const texto =
            plantilla.toUpperCase();

        if (
            texto.includes(
                'PLANTILLA FRONT SOPORTE'
            )
        ) {

            return 'FRONT';

        }

        if (
            texto.includes(
                'PLANTILLA BO SOPORTE'
            )
        ) {

            return 'BO';

        }

        return 'DESCONOCIDA';
    }

    // ============================================================
    // ANALIZAR PLANTILLA
    // ============================================================

    function analizarPlantilla(plantilla) {

        plantilla =
            plantilla.replace(/\r/g, '');

        const tipo =
            detectarPlantilla(plantilla);

        const nombre =
            obtenerCampo(
                plantilla,
                'Nombre'
            );

        const dni =
            obtenerCampo(
                plantilla,
                'DNI'
            ) ||
            obtenerCampo(
                plantilla,
                'DNI/NIE'
            );

        const id =
            obtenerCampo(
                plantilla,
                'ID'
            );

        const direccion =
            obtenerCampo(
                plantilla,
                'Dirección'
            );

        const movil =
            obtenerCampo(
                plantilla,
                '# Móvil'
            ) ||
            obtenerCampo(
                plantilla,
                'Móvil'
            );

        // ========================================================
        // AVERÍA
        // ========================================================

        let averia =
            obtenerCampo(
                plantilla,
                'Avería'
            );

        if (!averia) {

            averia =
                obtenerCampo(
                    plantilla,
                    'Averia'
                );
        }

        averia =
            averia.trim();

        let numeroCaso = '';

        // Si existe avería real
        if (
            averia &&
            !/^NA$/i.test(averia) &&
            !/^N\/A$/i.test(averia)
        ) {

            numeroCaso =
                averia
                    .replace(/^#/, '')
                    .trim();

        } else {

            // Si Avería = NA
            // usamos el ID del cliente

            numeroCaso =
                id;
        }

        // ========================================================
        // CAMPOS
        // ========================================================

        const diagnostico =
            extraerCampoMultilinea(
                plantilla,
                'Qué dice el diagnostico que le sucede',
                [
                    'Pruebas realizadas desde el sistema',
                    'Pruebas realizadas con el cliente',
                    'Qué has averiguado con tu diagnóstico?',
                    'Solución',
                    'Avería',
                    'CIERRE DE TICKET'
                ]
            );

        const pruebasSistema =
            extraerCampoMultilinea(
                plantilla,
                'Pruebas realizadas desde el sistema',
                [
                    'Pruebas realizadas con el cliente',
                    'Qué has averiguado con tu diagnóstico?',
                    'Solución',
                    'Avería',
                    'CIERRE DE TICKET'
                ]
            );

        const pruebasCliente =
            extraerCampoMultilinea(
                plantilla,
                'Pruebas realizadas con el cliente',
                [
                    'Qué has averiguado con tu diagnóstico?',
                    'Solución',
                    'Avería',
                    'CIERRE DE TICKET'
                ]
            );

        const averiguado =
            extraerCampoMultilinea(
                plantilla,
                'Qué has averiguado con tu diagnóstico?',
                [
                    'Solución',
                    'Avería',
                    'CIERRE DE TICKET'
                ]
            );

        const solucion =
            extraerCampoMultilinea(
                plantilla,
                'Solución',
                [
                    'Avería',
                    'CIERRE DE TICKET'
                ]
            );

        const tecnologia =
            obtenerCampo(
                plantilla,
                'Tecnología'
            );

        const velocidad =
            obtenerCampo(
                plantilla,
                'Velocidad'
            );

        const fecha =
            obtenerCampo(
                plantilla,
                'Fecha'
            );

        return {
            tipo,
            nombre,
            dni,
            id,
            direccion,
            movil,
            numeroCaso,
            averia,
            diagnostico,
            pruebasSistema,
            pruebasCliente,
            averiguado,
            solucion,
            tecnologia,
            velocidad,
            fecha
        };
    }

    // ============================================================
    // GENERAR OBSERVACIONES
    // ============================================================

    function generarObservaciones(datos) {

        return `Nombre: ${datos.nombre || 'N/A'}
DNI/NIE: ${datos.dni || 'N/A'}
ID: ${datos.id || 'N/A'}
Dirección: ${datos.direccion || 'N/A'}
Móvil: ${datos.movil || 'N/A'}
• Qué dice el cliente que le sucede: ${datos.diagnostico || 'N/A'}
• Pruebas realizadas: ${datos.pruebasSistema || 'N/A'}
• Diagnóstico: ${datos.averiguado || 'N/A'}
• Solución: ${datos.solucion || 'N/A'}
• Avería: ${datos.averia || 'NA'}
Tecnología: ${datos.tecnologia || 'N/A'}
Velocidad: ${datos.velocidad || 'N/A'}
Fecha: ${datos.fecha || 'N/A'}`;
    }

    // ============================================================
    // ESTABLECER VALOR REACT
    // ============================================================

    function establecerValor(
        elemento,
        valor
    ) {

        if (!elemento) {
            return false;
        }

        const prototype =
            elemento instanceof HTMLTextAreaElement
                ? HTMLTextAreaElement.prototype
                : HTMLInputElement.prototype;

        const descriptor =
            Object.getOwnPropertyDescriptor(
                prototype,
                'value'
            );

        if (
            descriptor &&
            descriptor.set
        ) {

            descriptor.set.call(
                elemento,
                valor
            );

        } else {

            elemento.value =
                valor;
        }

        elemento.dispatchEvent(
            new Event(
                'input',
                { bubbles: true }
            )
        );

        elemento.dispatchEvent(
            new Event(
                'change',
                { bubbles: true }
            )
        );

        elemento.dispatchEvent(
            new Event(
                'blur',
                { bubbles: true }
            )
        );

        return true;
    }

    // ============================================================
    // BUSCAR INPUT
    // ============================================================

    function obtenerInputNumeroCaso() {

        let input =
            document.querySelector(
                '#TextField1'
            );

        if (input) {
            return input;
        }

        input =
            document.querySelector(
                'input[aria-label*="Número de caso"]'
            );

        return input;
    }

    // ============================================================
    // BUSCAR OBSERVACIONES
    // ============================================================

    function obtenerTextareaObservaciones() {

        let textarea =
            document.querySelector(
                '#TextField8'
            );

        if (textarea) {
            return textarea;
        }

        textarea =
            document.querySelector(
                'textarea[aria-label*="Observaciones"]'
            );

        return textarea;
    }

    // ============================================================
    // RELLENAR FORMULARIO
    // ============================================================

    function rellenarFormulario(
        plantilla
    ) {

        const datos =
            analizarPlantilla(
                plantilla
            );

        // --------------------------------------------------------
        // VALIDACIÓN ID
        // --------------------------------------------------------

        if (!datos.id) {

            mostrarToast(
                'No se encontró el ID del cliente.',
                'error'
            );

            return;
        }

        // --------------------------------------------------------
        // VALIDACIÓN NÚMERO DE CASO
        // --------------------------------------------------------

        if (!datos.numeroCaso) {

            mostrarToast(
                'No se pudo determinar el número de caso.',
                'error'
            );

            return;
        }

        const inputCaso =
            obtenerInputNumeroCaso();

        const textarea =
            obtenerTextareaObservaciones();

        if (!inputCaso) {

            mostrarToast(
                'No se encontró el campo Número de caso.',
                'error'
            );

            return;
        }

        if (!textarea) {

            mostrarToast(
                'No se encontró el campo Observaciones.',
                'error'
            );

            return;
        }

        // --------------------------------------------------------
        // RELLENAR CASO
        // --------------------------------------------------------

        establecerValor(
            inputCaso,
            datos.numeroCaso
        );

        // --------------------------------------------------------
        // RELLENAR OBSERVACIONES
        // --------------------------------------------------------

        establecerValor(
            textarea,
            generarObservaciones(datos)
        );

        // --------------------------------------------------------
        // TIPología NO SE TOCA
        // --------------------------------------------------------

        cerrarVentana();

        // --------------------------------------------------------
        // MENSAJE
        // --------------------------------------------------------

        let mensaje =
            'Formulario rellenado correctamente.';

        if (datos.tipo === 'BO') {

            mensaje +=
                ' Plantilla BO detectada.';

        } else if (datos.tipo === 'FRONT') {

            mensaje +=
                ' Plantilla FRONT detectada.';
        }

        mensaje +=
            ` Número de caso: ${datos.numeroCaso}`;

        mostrarToast(
            mensaje
        );
    }

    // ============================================================
    // OVERLAY
    // ============================================================

    const overlay =
        document.createElement('div');

    overlay.id =
        'bo-soporte-bookmarklet';

    Object.assign(
        overlay.style,
        {
            position: 'fixed',
            inset: '0',
            zIndex: '2147483646',
            background: 'rgba(0,0,0,.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily:
                'Segoe UI, Arial, sans-serif'
        }
    );

    // ============================================================
    // VENTANA
    // ============================================================

    const ventana =
        document.createElement('div');

    Object.assign(
        ventana.style,
        {
            width: CONFIG.ancho,
            maxWidth:
                'calc(100vw - 40px)',
            background:
                '#ffffff',
            borderRadius:
                '10px',
            boxShadow:
                '0 15px 45px rgba(0,0,0,.22)',
            overflow:
                'hidden',
            animation:
                'boEntrada .25s ease'
        }
    );

    // ============================================================
    // CABECERA
    // ============================================================

    const cabecera =
        document.createElement('div');

    Object.assign(
        cabecera.style,
        {
            padding:
                '13px 16px 10px',
            background:
                'linear-gradient(135deg,#005E50,#087f6d)',
            color:
                '#fff'
        }
    );

    const titulo =
        document.createElement('div');

    titulo.textContent =
        'Cargar plantilla de soporte';

    Object.assign(
        titulo.style,
        {
            fontSize:
                '17px',
            fontWeight:
                '700'
        }
    );

    cabecera.appendChild(
        titulo
    );

    // ============================================================
    // DESCRIPCIÓN
    // ============================================================

    const subtitulo =
        document.createElement('div');

    subtitulo.textContent =
        'BO SOPORTE o FRONT SOPORTE';

    Object.assign(
        subtitulo.style,
        {
            marginTop:
                '3px',
            fontSize:
                '11px',
            opacity:
                '.82'
        }
    );

    cabecera.appendChild(
        subtitulo
    );

    // ============================================================
    // CUERPO
    // ============================================================

    const cuerpo =
        document.createElement('div');

    Object.assign(
        cuerpo.style,
        {
            padding:
                '12px 16px'
        }
    );

    // ============================================================
    // TEXTAREA
    // ============================================================

    const textarea =
        document.createElement('textarea');

    textarea.id =
        'bo-soporte-plantilla';

    /*
     * EJEMPLO QUE APARECERÁ CUANDO ESTÉ VACÍO
     */

    textarea.placeholder =
`PLANTILLA BO SOPORTE

• Nombre: ...
• DNI: ...
• ID: ...
• Dirección: ...
• # Móvil: ...
• Qué dice el diagnostico que le sucede: ...
• Pruebas realizadas desde el sistema: ...
• Pruebas realizadas con el cliente: ...
• Qué has averiguado con tu diagnóstico?: ...
• Solución: ...
• Avería: NA`;

    Object.assign(
        textarea.style,
        {
            width:
                '100%',
            height:
                CONFIG.altoTextarea,
            resize:
                'vertical',
            padding:
                '10px',
            border:
                '1px solid #b8b8b8',
            borderRadius:
                '4px',
            outline:
                'none',
            fontFamily:
                'Consolas, "Courier New", monospace',
            fontSize:
                '12px',
            lineHeight:
                '1.48',
            color:
                '#222',
            background:
                '#fff'
        }
    );

    cuerpo.appendChild(
        textarea
    );

    // ============================================================
    // PIE
    // ============================================================

    const pie =
        document.createElement('div');

    Object.assign(
        pie.style,
        {
            padding:
                '9px 16px 12px',
            display:
                'flex',
            justifyContent:
                'flex-end',
            gap:
                '8px',
            borderTop:
                '1px solid #eee',
            background:
                '#fafafa'
        }
    );

    // ============================================================
    // CANCELAR
    // ============================================================

    const cancelar =
        document.createElement('button');

    cancelar.textContent =
        'Cancelar';

    Object.assign(
        cancelar.style,
        {
            padding:
                '8px 14px',
            border:
                '1px solid #aaa',
            borderRadius:
                '5px',
            background:
                '#fff',
            color:
                '#333',
            cursor:
                'pointer',
            fontSize:
                '12px'
        }
    );

    cancelar.onclick =
        cerrarVentana;

    // ============================================================
    // RELLENAR
    // ============================================================

    const rellenar =
        document.createElement('button');

    rellenar.textContent =
        'Rellenar formulario';

    Object.assign(
        rellenar.style,
        {
            padding:
                '8px 15px',
            border:
                '1px solid #005E50',
            borderRadius:
                '5px',
            background:
                '#005E50',
            color:
                '#fff',
            cursor:
                'pointer',
            fontSize:
                '12px',
            fontWeight:
                '600'
        }
    );

    rellenar.onclick =
        function () {

            const plantilla =
                textarea.value.trim();

            if (!plantilla) {

                mostrarToast(
                    'Pega primero la plantilla.',
                    'warning'
                );

                textarea.focus();

                return;
            }

            rellenar.disabled =
                true;

            rellenar.textContent =
                'Rellenando...';

            setTimeout(() => {

                rellenarFormulario(
                    plantilla
                );

            }, 100);
        };

    pie.appendChild(
        cancelar
    );

    pie.appendChild(
        rellenar
    );

    // ============================================================
    // ARMAR
    // ============================================================

    ventana.appendChild(
        cabecera
    );

    ventana.appendChild(
        cuerpo
    );

    ventana.appendChild(
        pie
    );

    overlay.appendChild(
        ventana
    );

    document.body.appendChild(
        overlay
    );

    // ============================================================
    // CERRAR
    // ============================================================

    function cerrarVentana() {

        overlay.style.opacity =
            '0';

        overlay.style.transition =
            'opacity .25s ease';

        setTimeout(() => {

            overlay.remove();

        }, 250);
    }

    // ============================================================
    // ESCAPE
    // ============================================================

    document.addEventListener(
        'keydown',
        function escape(event) {

            if (
                event.key === 'Escape'
            ) {

                cerrarVentana();

                document.removeEventListener(
                    'keydown',
                    escape
                );
            }
        }
    );

    // ============================================================
    // FOCUS
    // ============================================================

    setTimeout(() => {

        textarea.focus();

    }, 250);

})();
