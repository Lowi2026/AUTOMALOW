(()=>{
    const w = document.createElement("div");

    w.style = `
        position:fixed;
        z-index:999999;
        inset:0;
        background:rgba(0,0,0,.55);
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:Arial
    `;

    w.innerHTML = `
        <div style="
            background:#fff;
            width:700px;
            max-width:90%;
            padding:20px;
            border-radius:10px;
            box-shadow:0 10px 40px #000
        ">

            <h2 style="margin:0 0 12px">
                Cargar PLANTILLA BO SOPORTE
            </h2>

            <textarea
                id="boPlantilla"
                style="
                    width:100%;
                    height:400px;
                    box-sizing:border-box;
                    padding:10px;
                    font-size:13px;
                    resize:vertical
                "
                placeholder="Pega aquí la plantilla completa..."
            ></textarea>

            <div style="margin-top:12px;text-align:right">

                <button
                    id="boCancelar"
                    style="padding:8px 15px;margin-right:8px"
                >
                    Cancelar
                </button>

                <button
                    id="boRellenar"
                    style="padding:8px 18px"
                >
                    Rellenar formulario
                </button>

            </div>
        </div>
    `;

    document.body.appendChild(w);

    document.getElementById("boCancelar").onclick = () => {
        w.remove();
    };

    document.getElementById("boRellenar").onclick = () => {

        const texto = document.getElementById("boPlantilla").value;

        if (!texto.trim()) {
            alert("No has introducido ninguna plantilla.");
            return;
        }

        // ================================
        // EXTRAER ID CLIENTE
        // ================================

        const idm = texto.match(
            /(?:•\s*)?ID\s*:\s*([0-9]+)/i
        );

        // ================================
        // EXTRAER AVERÍA
        // ================================

        const am = texto.match(
            /(?:•\s*)?Aver[ií]a\s*:\s*(?:#\s*)?([0-9]+|NA)\b/i
        );

        if (!idm) {
            alert("No se encontró el ID del cliente.");
            return;
        }

        const idCliente = idm[1];

        // ================================
        // DETERMINAR NÚMERO DE CASO
        // ================================

        let numeroCaso = idCliente;

        if (
            am &&
            am[1] &&
            am[1].toUpperCase() !== "NA"
        ) {
            numeroCaso = am[1];
        }

        // ================================
        // BUSCAR CAMPOS DEL FORMULARIO
        // ================================

        const inputCaso = document.querySelector("#TextField1");
        const inputObservaciones = document.querySelector("#TextField8");

        if (!inputCaso) {
            alert(
                "No se encontró el campo 'Número de caso'."
            );
            return;
        }

        if (!inputObservaciones) {
            alert(
                "No se encontró el campo 'Observaciones'."
            );
            return;
        }

        // ================================
        // FUNCIÓN PARA CAMBIAR INPUTS
        // ================================

        const setValue = (elemento, valor) => {

            const setter =
                Object.getOwnPropertyDescriptor(
                    Object.getPrototypeOf(elemento),
                    "value"
                )?.set;

            if (setter) {
                setter.call(elemento, valor);
            } else {
                elemento.value = valor;
            }

            elemento.dispatchEvent(
                new Event("input", {
                    bubbles: true
                })
            );

            elemento.dispatchEvent(
                new Event("change", {
                    bubbles: true
                })
            );

            elemento.dispatchEvent(
                new Event("blur", {
                    bubbles: true
                })
            );
        };

        // ================================
        // RELLENAR
        // ================================

        setValue(
            inputCaso,
            numeroCaso
        );

        setValue(
            inputObservaciones,
            texto
        );

        // ================================
        // GUARDAR VALORES
        // ================================

        window.__BO_NUMERO_CASO = numeroCaso;
        window.__BO_OBSERVACIONES = texto;
        window.__BO_LOCK = true;

        // ================================
        // VIGILAR QUE LISTS NO BORRE
        // EL NÚMERO DE CASO
        // ================================

        window.__BO_TIMER = setInterval(() => {

            if (!window.__BO_LOCK) {
                return;
            }

            const casoActual =
                document.querySelector("#TextField1");

            if (
                casoActual &&
                casoActual.value !== window.__BO_NUMERO_CASO
            ) {
                setValue(
                    casoActual,
                    window.__BO_NUMERO_CASO
                );
            }

            const observacionesActuales =
                document.querySelector("#TextField8");

            if (
                observacionesActuales &&
                observacionesActuales.value !== window.__BO_OBSERVACIONES
            ) {
                setValue(
                    observacionesActuales,
                    window.__BO_OBSERVACIONES
                );
            }

        }, 300);

        // ================================
        // CERRAR VENTANA
        // ================================

        w.remove();

        alert(
            "Formulario rellenado correctamente.\n\n" +
            "Número de caso: " + numeroCaso + "\n\n" +
            "Tipología queda para selección manual."
        );
    };

})();
