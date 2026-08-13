(function () {
    'use strict';

    /* ============================================================
       PRODUCTIVIDAD BO / FRONT - MICROSOFT LISTS
       ============================================================ */

    const SCRIPT_NAME = 'Productividad BO / FRONT';

    /* ------------------------------------------------------------
       UTILIDADES
       ------------------------------------------------------------ */

    function limpiarTexto(texto) {
        return (texto || '')
            .replace(/\r/g, '')
            .replace(/\u00A0/g, ' ')
            .trim();
    }

    function obtenerCampo(texto, patrones) {
        for (const patron of patrones) {
            const match = texto.match(patron);

            if (match && match[1]) {
                return limpiarTexto(match[1]);
            }
        }

        return '';
    }

    /* ------------------------------------------------------------
       DETECTAR TIPO DE PLANTILLA
       ------------------------------------------------------------ */

    function detectarPlantilla(texto) {

        const textoMayus = texto.toUpperCase();

        if (
            textoMayus.includes('PLANTILLA FRONT SOPORTE') ||
            textoMayus.includes('FRONT SOPORTE')
        ) {
            return 'FRONT';
        }

        if (
            textoMayus.includes('PLANTILLA BO SOPORTE') ||
            textoMayus.includes('BO SOPORTE')
        ) {
            return 'BO';
        }

        return 'DESCONOCIDA';
    }

    /* ------------------------------------------------------------
       EXTRAER DATOS
       ------------------------------------------------------------ */

    function analizarPlantilla(texto) {

        const plantilla = detectarPlantilla(texto);

        const idCliente = obtenerCampo(texto, [
            /(?:^|\n)\s*[•\-\*]?\s*ID\s*:\s*(.+?)(?=\n|$)/i
        ]);

        const averia = obtenerCampo(texto, [
            /(?:^|\n)\s*[•\-\*]?\s*Aver[ií]a\s*:\s*(.+?)(?=\n|$)/i
        ]);

        const nombre = obtenerCampo(texto, [
            /(?:^|\n)\s*[•\-\*]?\s*Nombre\s*:\s*(.+?)(?=\n|$)/i
        ]);

        const dni = obtenerCampo(texto, [
            /(?:^|\n)\s*[•\-\*]?\s*DNI(?:\/NIE)?\s*:\s*(.+?)(?=\n|$)/i
        ]);

        const direccion = obtenerCampo(texto, [
            /(?:^|\n)\s*[•\-\*]?\s*Direcci[oó]n\s*:\s*(.+?)(?=\n|$)/i
        ]);

        const movil = obtenerCampo(texto, [
            /(?:^|\n)\s*[•\-\*]?\s*#?\s*M[oó]vil\s*:\s*(.+?)(?=\n|$)/i
        ]);

        /* --------------------------------------------------------
           DETERMINAR NÚMERO DE CASO

           Avería:
               #545452  -> 545452

           Avería:
               545452   -> 545452

           Avería:
               NA       -> ID del cliente
        -------------------------------------------------------- */

        let numeroCaso = '';

        if (averia) {

            const averiaLimpia = averia
                .replace(/^#+/, '')
                .trim();

            if (
                averiaLimpia &&
                !/^NA$/i.test(averiaLimpia) &&
                !/^N\/A$/i.test(averiaLimpia) &&
                !/^NO\s*APLICA$/i.test(averiaLimpia)
            ) {
                numeroCaso = averiaLimpia;
            }
        }

        if (!numeroCaso && idCliente) {
            numeroCaso = idCliente;
        }

        return {
            plantilla,
            idCliente,
            averia,
            numeroCaso,
            nombre,
            dni,
            direccion,
            movil
        };
    }

    /* ------------------------------------------------------------
       CREAR INTERFAZ
       ------------------------------------------------------------ */

    function crearInterfaz() {

        if (document.getElementById('productividad-bo-overlay')) {
            return;
        }

        const overlay = document.createElement('div');

        overlay.id = 'productividad-bo-overlay';

        overlay.innerHTML = `
            <div id="productividad-bo-modal">

                <div id="productividad-bo-header">
                    <div>
                        <div id="productividad-bo-title">
                            Cargar plantilla
                        </div>

                        <div id="productividad-bo-subtitle">
                            BO / FRONT SOPORTE
                        </div>
                    </div>

                    <button id="productividad-bo-close"
                            type="button"
                            title="Cerrar">
                        ×
                    </button>
                </div>

                <div id="productividad-bo-template-label">
                    Plantilla
                </div>

                <textarea
                    id="productividad-bo-textarea"
                    placeholder="Pega aquí la plantilla completa...

PLANTILLA BO SOPORTE

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
• Avería: NA
"
                ></textarea>

                <div id="productividad-bo-info">
                    <span id="productividad-bo-detected">
                        Esperando plantilla...
                    </span>
                </div>

                <div id="productividad-bo-actions">

                    <button
                        type="button"
                        id="productividad-bo-cancel">
                        Cancelar
                    </button>

                    <button
                        type="button"
                        id="productividad-bo-fill">
                        Rellenar formulario
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        aplicarEstilos();

        configurarEventos();
    }

    /* ------------------------------------------------------------
       ESTILOS
       ------------------------------------------------------------ */

    function aplicarEstilos() {

        const style = document.createElement('style');

        style.id = 'productividad-bo-style';

        style.textContent = `

            #productividad-bo-overlay {
                position: fixed;
                inset: 0;
                z-index: 2147483646;

                display: flex;
                align-items: center;
                justify-content: center;

                background: rgba(0,0,0,0.18);

                animation:
                    productividadOverlayIn
                    .18s
                    ease-out;
            }

            #productividad-bo-modal {

                width: 620px;
                max-width: calc(100vw - 40px);

                background: #ffffff;

                border-radius: 12px;

                box-shadow:
                    0 18px 50px rgba(0,0,0,.25);

                overflow: hidden;

                font-family:
                    "Segoe UI",
                    Arial,
                    sans-serif;

                color: #242424;
            }

            #productividad-bo-header {

                display: flex;

                align-items: center;
                justify-content: space-between;

                padding:
                    14px
                    18px
                    10px
                    18px;

                border-bottom:
                    1px solid #eeeeee;
            }

            #productividad-bo-title {

                font-size: 18px;

                font-weight: 600;

                line-height: 1.2;
            }

            #productividad-bo-subtitle {

                margin-top: 3px;

                font-size: 12px;

                color: #777777;

                letter-spacing: .3px;
            }

            #productividad-bo-close {

                border: none;

                background: transparent;

                width: 32px;
                height: 32px;

                border-radius: 6px;

                font-size: 24px;

                color: #666;

                cursor: pointer;

                line-height: 28px;
            }

            #productividad-bo-close:hover {

                background: #f3f3f3;

                color: #111;
            }

            #productividad-bo-template-label {

                padding:
                    13px
                    18px
                    6px
                    18px;

                font-size: 12px;

                font-weight: 600;

                color: #555;
            }

            #productividad-bo-textarea {

                display: block;

                width: calc(100% - 36px);

                height: 300px;

                margin:
                    0
                    18px;

                box-sizing: border-box;

                resize: vertical;

                border:
                    1px solid #d1d1d1;

                border-radius: 7px;

                padding: 12px;

                outline: none;

                font-family:
                    Consolas,
                    "Courier New",
                    monospace;

                font-size: 12px;

                line-height: 1.5;

                color: #333;

                background: #fff;
            }

            #productividad-bo-textarea:focus {

                border-color: #0078d4;

                box-shadow:
                    0 0 0 1px #0078d4;
            }

            #productividad-bo-info {

                min-height: 25px;

                padding:
                    8px
                    18px
                    4px
                    18px;

                font-size: 12px;
            }

            #productividad-bo-detected {

                display: inline-block;

                padding:
                    4px
                    8px;

                border-radius: 5px;

                background: #f3f3f3;

                color: #666;
            }

            #productividad-bo-actions {

                display: flex;

                justify-content: flex-end;

                gap: 8px;

                padding:
                    12px
                    18px
                    16px
                    18px;
            }

            #productividad-bo-actions button {

                height: 34px;

                padding:
                    0
                    15px;

                border-radius: 6px;

                border:
                    1px solid #d1d1d1;

                background: #fff;

                cursor: pointer;

                font-size: 13px;

                font-family:
                    "Segoe UI",
                    Arial,
                    sans-serif;
            }

            #productividad-bo-cancel:hover {

                background: #f5f5f5;
            }

            #productividad-bo-fill {

                border-color: #0078d4 !important;

                background: #0078d4 !important;

                color: white;

                font-weight: 600;
            }

            #productividad-bo-fill:hover {

                background: #106ebe !important;
            }

            #productividad-bo-fill:disabled {

                opacity: .55;

                cursor: default;
            }

            @keyframes productividadOverlayIn {

                from {
                    opacity: 0;
                }

                to {
                    opacity: 1;
                }
            }

            @media(max-width:700px) {

                #productividad-bo-modal {

                    width:
                        calc(100vw - 24px);
                }

                #productividad-bo-textarea {

                    height: 250px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ------------------------------------------------------------
       EVENTOS DE INTERFAZ
       ------------------------------------------------------------ */

    function configurarEventos() {

        const overlay =
            document.getElementById(
                'productividad-bo-overlay'
            );

        const textarea =
            document.getElementById(
                'productividad-bo-textarea'
            );

        const fillButton =
            document.getElementById(
                'productividad-bo-fill'
            );

        const closeButton =
            document.getElementById(
                'productividad-bo-close'
            );

        const cancelButton =
            document.getElementById(
                'productividad-bo-cancel'
            );

        const detected =
            document.getElementById(
                'productividad-bo-detected'
            );

        textarea.addEventListener(
            'input',
            function () {

                const texto = textarea.value.trim();

                if (!texto) {

                    detected.textContent =
                        'Esperando plantilla...';

                    detected.style.background =
                        '#f3f3f3';

                    detected.style.color =
                        '#666';

                    return;
                }

                const datos =
                    analizarPlantilla(texto);

                let tipoTexto =
                    datos.plantilla === 'BO'
                        ? 'BO SOPORTE'
                        : datos.plantilla === 'FRONT'
                            ? 'FRONT SOPORTE'
                            : 'Plantilla no identificada';

                if (datos.numeroCaso) {

                    detected.textContent =
                        tipoTexto +
                        ' · Caso: ' +
                        datos.numeroCaso;

                    detected.style.background =
                        '#e8f3ff';

                    detected.style.color =
                        '#005a9e';

                } else {

                    detected.textContent =
                        tipoTexto +
                        ' · No se encontró ID/Avería';

                    detected.style.background =
                        '#fff4ce';

                    detected.style.color =
                        '#7a5c00';
                }
            }
        );

        fillButton.addEventListener(
            'click',
            function () {

                const texto =
                    textarea.value.trim();

                if (!texto) {

                    mostrarToast(
                        'Pega primero la plantilla.',
                        'warning'
                    );

                    return;
                }

                const datos =
                    analizarPlantilla(texto);

                if (!datos.numeroCaso) {

                    mostrarToast(
                        'No se encontró ID ni número de avería.',
                        'error'
                    );

                    return;
                }

                fillButton.disabled = true;

                const resultado =
                    rellenarFormulario(
                        datos,
                        texto
                    );

                if (resultado) {

                    cerrarModal();

                    mostrarToast(
                        'Formulario rellenado · Caso: ' +
                        datos.numeroCaso +
                        ' · Tipología manual',
                        'success'
                    );

                } else {

                    fillButton.disabled = false;

                    mostrarToast(
                        'No se encontró el formulario de Microsoft Lists.',
                        'error'
                    );
                }
            }
        );

        closeButton.addEventListener(
            'click',
            cerrarModal
        );

        cancelButton.addEventListener(
            'click',
            cerrarModal
        );

        overlay.addEventListener(
            'click',
            function (e) {

                if (e.target === overlay) {
                    cerrarModal();
                }
            }
        );

        document.addEventListener(
            'keydown',
            function productividadEscape(e) {

                if (
                    e.key === 'Escape' &&
                    document.getElementById(
                        'productividad-bo-overlay'
                    )
                ) {
                    cerrarModal();

                    document.removeEventListener(
                        'keydown',
                        productividadEscape
                    );
                }
            }
        );

        setTimeout(() => {
            textarea.focus();
        }, 100);
    }

    /* ------------------------------------------------------------
       RELLENAR INPUT DE MICROSOFT LISTS
       ------------------------------------------------------------ */

    function establecerValorInput(input, valor) {

        if (!input) {
            return false;
        }

        const descriptor =
            Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value'
            );

        if (
            descriptor &&
            descriptor.set
        ) {
            descriptor.set.call(
                input,
                valor
            );
        } else {
            input.value = valor;
        }

        input.dispatchEvent(
            new Event(
                'input',
                {
                    bubbles: true
                }
            )
        );

        input.dispatchEvent(
            new Event(
                'change',
                {
                    bubbles: true
                }
            )
        );

        input.dispatchEvent(
            new Event(
                'blur',
                {
                    bubbles: true
                }
            )
        );

        return true;
    }

    /* ------------------------------------------------------------
       BUSCAR INPUT DE NÚMERO DE CASO
       ------------------------------------------------------------ */

    function obtenerInputCaso() {

        let input =
            document.getElementById(
                'TextField1'
            );

        if (input) {
            return input;
        }

        input =
            document.querySelector(
                'input[aria-label*="Número de caso"]'
            );

        if (input) {
            return input;
        }

        input =
            document.querySelector(
                'input[placeholder*="Introducir un valor"]'
            );

        return input || null;
    }

    /* ------------------------------------------------------------
       BUSCAR OBSERVACIONES
       ------------------------------------------------------------ */

    function obtenerInputObservaciones() {

        let textarea =
            document.getElementById(
                'TextField8'
            );

        if (textarea) {
            return textarea;
        }

        textarea =
            document.querySelector(
                'textarea[aria-label*="Observaciones"]'
            );

        return textarea || null;
    }

    /* ------------------------------------------------------------
       RELLENAR OBSERVACIONES
       ------------------------------------------------------------ */

    function establecerValorTextarea(
        textarea,
        valor
    ) {

        if (!textarea) {
            return false;
        }

        const descriptor =
            Object.getOwnPropertyDescriptor(
                HTMLTextAreaElement.prototype,
                'value'
            );

        if (
            descriptor &&
            descriptor.set
        ) {
            descriptor.set.call(
                textarea,
                valor
            );
        } else {
            textarea.value = valor;
        }

        textarea.dispatchEvent(
            new Event(
                'input',
                {
                    bubbles: true
                }
            )
        );

        textarea.dispatchEvent(
            new Event(
                'change',
                {
                    bubbles: true
                }
            )
        );

        return true;
    }

    /* ------------------------------------------------------------
       RELLENAR FORMULARIO
       ------------------------------------------------------------ */

    function rellenarFormulario(
        datos,
        plantilla
    ) {

        const inputCaso =
            obtenerInputCaso();

        if (!inputCaso) {
            return false;
        }

        /*
         * IMPORTANTE:
         *
         * Guardamos el número para poder recuperarlo
         * si Microsoft Lists lo borra al seleccionar
         * posteriormente la Tipología.
         */

        window.__PRODUCTIVIDAD_BO_CASO =
            datos.numeroCaso;

        /* Número de caso */

        establecerValorInput(
            inputCaso,
            datos.numeroCaso
        );

        /* --------------------------------------------------------
           OBSERVACIONES

           Se conserva la plantilla completa.
        -------------------------------------------------------- */

        const observaciones =
            obtenerInputObservaciones();

        if (observaciones) {

            establecerValorTextarea(
                observaciones,
                plantilla
            );
        }

        /* --------------------------------------------------------
           PROTEGER EL NÚMERO DE CASO

           Microsoft Lists puede limpiar TextField1 cuando
           el usuario selecciona la Tipología.

           Vigilamos el input y lo restauramos.
        -------------------------------------------------------- */

        protegerNumeroCaso(
            datos.numeroCaso
        );

        return true;
    }

    /* ------------------------------------------------------------
       PROTEGER NÚMERO DE CASO
       ------------------------------------------------------------ */

    function protegerNumeroCaso(
        numeroCaso
    ) {

        if (
            window.__PRODUCTIVIDAD_BO_OBSERVER
        ) {
            return;
        }

        const input =
            obtenerInputCaso();

        if (!input) {
            return;
        }

        window.__PRODUCTIVIDAD_BO_CASO =
            numeroCaso;

        /* MutationObserver */

        const observer =
            new MutationObserver(
                function () {

                    const actual =
                        input.value.trim();

                    if (
                        window.__PRODUCTIVIDAD_BO_CASO &&
                        actual !==
                        window.__PRODUCTIVIDAD_BO_CASO
                    ) {

                        /*
                         * Solo restauramos si el usuario
                         * dejó el campo vacío.
                         *
                         * No sobrescribimos manualmente
                         * otro número que el usuario haya
                         * escrito.
                         */

                        if (!actual) {

                            establecerValorInput(
                                input,
                                window.__PRODUCTIVIDAD_BO_CASO
                            );
                        }
                    }
                }
            );

        observer.observe(
            input,
            {
                attributes: true,
                attributeFilter: [
                    'value'
                ]
            }
        );

        /* También comprobamos periódicamente */

        const interval =
            setInterval(
                function () {

                    if (
                        !document.body.contains(input)
                    ) {

                        clearInterval(interval);

                        observer.disconnect();

                        return;
                    }

                    if (
                        window.__PRODUCTIVIDAD_BO_CASO &&
                        !input.value.trim()
                    ) {

                        establecerValorInput(
                            input,
                            window.__PRODUCTIVIDAD_BO_CASO
                        );
                    }

                },
                250
            );

        window.__PRODUCTIVIDAD_BO_OBSERVER =
            observer;

        window.__PRODUCTIVIDAD_BO_INTERVAL =
            interval;
    }

    /* ------------------------------------------------------------
       CERRAR MODAL
       ------------------------------------------------------------ */

    function cerrarModal() {

        const overlay =
            document.getElementById(
                'productividad-bo-overlay'
            );

        if (!overlay) {
            return;
        }

        overlay.style.transition =
            'opacity .18s ease';

        overlay.style.opacity = '0';

        setTimeout(
            function () {

                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(
                        overlay
                    );
                }

            },
            180
        );
    }

    /* ------------------------------------------------------------
       TOAST
       ------------------------------------------------------------ */

    function mostrarToast(
        mensaje,
        tipo
    ) {

        const anterior =
            document.getElementById(
                'productividad-bo-toast'
            );

        if (anterior) {
            anterior.remove();
        }

        const toast =
            document.createElement('div');

        toast.id =
            'productividad-bo-toast';

        let icono = '?';

        if (tipo === 'error') {
            icono = '!';
        }

        if (tipo === 'warning') {
            icono = '!';
        }

        toast.innerHTML = `
            <div class="productividad-bo-toast-icon">
                ${icono}
            </div>

            <div class="productividad-bo-toast-text">
                ${mensaje}
            </div>
        `;

        document.body.appendChild(toast);

        const style =
            document.createElement('style');

        style.textContent = `

            #productividad-bo-toast {

                position: fixed;

                right: 22px;
                bottom: 22px;

                z-index: 2147483647;

                display: flex;

                align-items: center;

                gap: 10px;

                max-width: 380px;

                padding:
                    11px
                    15px;

                background: #ffffff;

                border:
                    1px solid #e1e1e1;

                border-radius: 8px;

                box-shadow:
                    0 8px 30px rgba(0,0,0,.18);

                font-family:
                    "Segoe UI",
                    Arial,
                    sans-serif;

                font-size: 13px;

                color: #333;

                animation:
                    productividadToastIn
                    .3s
                    ease-out
                    forwards;
            }

            .productividad-bo-toast-icon {

                width: 22px;
                height: 22px;

                border-radius: 50%;

                display: flex;

                align-items: center;
                justify-content: center;

                background: #107c10;

                color: #fff;

                font-size: 13px;

                font-weight: bold;

                flex-shrink: 0;
            }

            .productividad-bo-toast-text {

                line-height: 1.4;
            }

            @keyframes productividadToastIn {

                from {

                    opacity: 0;

                    transform:
                        translateY(15px);
                }

                to {

                    opacity: 1;

                    transform:
                        translateY(0);
                }
            }

            @keyframes productividadToastOut {

                from {

                    opacity: 1;

                    transform:
                        translateY(0);
                }

                to {

                    opacity: 0;

                    transform:
                        translateY(15px);
                }
            }
        `;

        document.head.appendChild(style);

        setTimeout(
            function () {

                toast.style.animation =
                    'productividadToastOut .35s ease forwards';

                setTimeout(
                    function () {

                        if (toast.parentNode) {
                            toast.parentNode.removeChild(
                                toast
                            );
                        }

                        if (style.parentNode) {
                            style.parentNode.removeChild(
                                style
                            );
                        }

                    },
                    350
                );

            },
            3500
        );
    }

    /* ------------------------------------------------------------
       INICIAR
       ------------------------------------------------------------ */

    crearInterfaz();

})();
