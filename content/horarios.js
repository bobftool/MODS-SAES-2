window.addEventListener("load", async () => {
  // Visualizar información
  const { SAESform, SAESvisualizarButton } = getSAEScomponents();
  if (SAESvisualizarButton) SAESform.submit();

  // Cargar banderas de control
  loadFlags();

  // Obtener horarios guardados por el usuario
  const horariosGuardados =
    (await chrome.storage.local.get("userHorariosGuardados"))
      .userHorariosGuardados || [];

  const hasHorariosGuardados = horariosGuardados.length > 0;

  // Obtener horarios generados por el usuario
  const horariosGenerados =
    (await chrome.storage.local.get("userHorariosGenerados"))
      .userHorariosGenerados || [];
  const hasHorariosGenerados = horariosGenerados.length > 0;

  // Obtener banderas
  const isAutomatic = (await chrome.storage.local.get("isAutomatic"))
    .isAutomatic;
  const isManual = (await chrome.storage.local.get("isManual")).isManual;

  // Cargar componentes HTML
  loadComponents();

  // Cargar estilos CSSs
  loadStyles(isAutomatic, isManual, hasHorariosGenerados, hasHorariosGuardados);

  // Configurar el botón de generación automática
  setupButtonStartAutomatic();

  // Configurar el botón de selección manual
  setupButtonStartManual();

  // Si se ha activado la generación automática, iniciar el controlador automático
  if (isAutomatic) {
    await automaticController();
  }

  // Si se ha activado la selección manual, iniciar el controlador manual
  if (isManual) {
    await manualController();
  }

  if (hasHorariosGuardados) {
    setupContainerHorariosGuardados(horariosGuardados);
  }
});

function loadFlags() {
  // Generación automática
  chrome.storage.local.get("isAutomatic", (result) => {
    if (result.isAutomatic == undefined)
      chrome.storage.local.set({ isAutomatic: false });
  });
  // Selección manual
  chrome.storage.local.get("isManual", (result) => {
    if (result.isManual == undefined)
      chrome.storage.local.set({ isManual: false });
  });
  // Escaneo de clases
  chrome.storage.local.get("isScanning", (result) => {
    if (result.isScanning == undefined)
      chrome.storage.local.set({ isScanning: false });
  });
}

function loadComponents() {
  const html =
    // Contenido HTML
    `
    <div id="loading-overlay"><strong>Escaneando horarios, por favor espera...</strong></div>
    <div class="reprobados-container">
    <div class="panel-container">
      <div id="initial-container">
        <h3 class="panel-title">Crea tu horario</h3>
        <div class="buttons-container">
          <button class="button" id="button-start-automatic">Generar automáticamente</button>
          <button class="button" id="button-start-manual">Seleccionar manualmente</button>
        </div>
      </div>

      <div id="automatic-container">
        <div id="title-container">
          <h3 class="panel-title">Generar horarios</h3>
          <button id="button-automatic-update" class="button-mini">Actualizar</button>
          <button id="button-automatic-finish" class="button-mini">Finalizar</button>
        </div>
        <div id="form-container">
          <div>
            <label>Carrera:</label>
            <select class="select" id="carrera-select"></select>
          </div>

          <div>
            <label id="plan-label">Plan de estudio:</label>
            <select class="select" id="plan-select"></select>
          </div>

          <div>
            <label id="asignaturas-label">Asignaturas:</label>
            <select id="asignaturas-select" multiple hidden></select>
          </div>
        </div>
        <button class="button" id="button-generate-automatic">Generar horarios</button>

        <div id="warning">
          <img src="https://williamturner-grading.com/images/others/wytgrd-loader-gif.gif" alt="Cargando" style="width: 150px; margin-right: -27px;">
          <p>Generando horarios, por favor espera...</p>
        </div>

        <div class="horarios-container">
          <div id="horarios-slider-automatic" class="horarios-slider"></div>
        </div>
      </div>

      <div id="manual-container">
        <div id="title-container">
          <h3 class="panel-title">Selección manual</h3>
          <button id="button-manual-finish" class="button-mini">Finalizar</button>
        </div>
        
        <div class="horarios-container">
          <div id="horarios-slider-manual" class="horarios-slider"></div>
        </div>
      </div>
    </div>

    <div class="reprobados-container" id="guardados-container">
        <div class="panel-container">
          <h3 class="panel-title">Tus horarios guardados</h3>
          <div class="horarios-container">
            <div id="horarios-slider-guardados" class="horarios-slider"></div>
          </div>
        </div>
    </div>
  </div>
  `;

  // Insertar el HTML a la página
  const containerElement = document.querySelector(".container");

  if (containerElement) {
    containerElement.insertAdjacentHTML("afterbegin", html);
  }
}

function loadStyles(
  isAutomatic,
  isManual,
  hasHorariosGenerados,
  hasHorariosGuardados
) {
  const MultiSelectTagStyles = `
  .mult-select-tag {
      display: flex;
      width:100%;
      flex-direction: column;
      align-items: center;
      position: relative;
  }

  .mult-select-tag .wrapper {
      width: 100%;
      border-radius: 9px;
      overflow: hidden;
      transition: box-shadow 0.5s ease, transform 0.5s ease;
  }

  .mult-select-tag .wrapper:hover {
      box-shadow: 0 5px 9px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
  }


  .mult-select-tag .body {
      display: flex;
      background: #f0f0f0;
      min-height: 36px;
      width: 100%;
      cursor: pointer;
  }

  .mult-select-tag .input-container {
      display: flex;
      flex-wrap: wrap;
      flex: 1 1 auto;
      padding: 0.1rem;
  }

  .mult-select-tag .input-body {
      display: flex;
      width: 100%;
  }

  .mult-select-tag .input {
      flex:1;
      background: white;
      border-radius: 5px;
      padding: 0.45rem;
      margin: 10px;
      outline: none;
      border: none;
  }

  .mult-select-tag .btn-container {
      color: var(--color-gris);
      padding: 0.5rem;
      display: flex;
  }

  .mult-select-tag button {
      cursor: pointer;
      width: 100%;
      color: #000000;
      outline: 0;
      height: 100%;
      border: none;
      padding: 0;
      background: transparent;
      background-image: none;
      -webkit-appearance: none;
      text-transform: none;
      margin: 0;
  }

  .mult-select-tag button:first-child {
      width: 1rem;
      height: 90%;
  }


  .mult-select-tag .drawer {
      position: absolute;
      background: #f0f0f0;
      max-height: 15rem;
      z-index: 40;
      top: 98%;
      width: 100%;
      overflow-y: scroll;
      border-radius: 9px;
      box-shadow: 0 0 9px rgba(0, 0, 0, 0.2);
  }

  .mult-select-tag ul {
      list-style-type: none;
      padding: 0.5rem;
      margin: 0;
  }

  .mult-select-tag ul li {
      padding: 0.5rem;
      border-radius: 5px;
      cursor: pointer;
  }

  .mult-select-tag ul li:hover {
      background: #D90452;
      color: white;
      font-weight: bold;
  }

  .mult-select-tag .item-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.2rem 0.4rem;
      margin: 0.2rem;
      font-weight: bold;
      background: #ffffff;
      border-radius: 5px;
      max-height: 20px;
  }

  .mult-select-tag .item-label {
      max-width: 100%;
      line-height: 1;
      font-size: 0.75rem;
      font-weight: 400;
      flex: 0 1 auto;
      color: #000000;
  }

  .mult-select-tag .item-close-container {
      display: flex;
      flex: 1 1 auto;
      flex-direction: row-reverse;
  }

  .mult-select-tag .item-close-svg {
      width: 1rem;
      margin-left: 0.5rem;
      height: 1rem;
      cursor: pointer;
      border-radius: 21px;
      display: block;
  }

  .hidden {
      display: none;
  }`;

  const styles =
    // Hoja de estilos CSS
    `
    #loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.420);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px); /* Safari */
      color: #D90452;
      display: none;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      z-index: 9999;
      filter: drop-shadow(0 0 50px white);
    }

    .reprobados-container {
      margin: 20px 0 20px;
      display: block;
      font-family: Arial, sans-serif;
      color: black;
      max-width: 600px;
    }

    .panel-container {
      background: white;
      padding: 17px 21px;
      border-radius: 21px;
      box-shadow: 0 0 19px rgba(0, 0, 0, 0.2);
    }

    #initial-container {
      display: flex;
      flex-direction: column;
      gap: 10px;

      ${isAutomatic || isManual ? "display: none;" : ""}
    }

    .panel-title {
      margin: 0;
      font-size: 19px;
      font-weight: bold;
    }

    .buttons-container {
      display: flex;
      width: 100%;
      gap: 10px;
      align-items: center;
    }

    .button {
      width: 100%;
      padding: 10px;
      background-color: #D90452;
      color: white;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      font-weight: bold;
      transition: box-shadow 0.5s ease, transform 0.5s ease;
    }

    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 9px rgba(0, 0, 0, 0.4);
    }

    #automatic-container {
      display: flex;
      flex-direction: column;
      gap: 10px;

      ${isAutomatic ? "" : "display: none;"}
    }

    #form-container {
      display: flex;
      flex-direction: column;
      gap: 7px;
      width: 100%;
    }

    #form-container label {
      font-weight: bold;
      display: block;
    }

    .select{
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      background-color: #f0f0f0;
      transition: box-shadow 0.5s ease, transform 0.5s ease;
    }

    .select:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 9px rgba(0, 0, 0, 0.2);
    }

    .select:focus {
      transform: translateY(-2px);
      box-shadow: 0 5px 9px rgba(0, 0, 0, 0.2);
    }

    #warning {
      background-color: #f0f0f0;
      display: none;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 200px;
      border-radius: 9px;
      animation: caerRebotar 2s ease-in-out infinite; /* Animación infinita para el ejemplo */
    }

    @keyframes caerRebotar {
      0% {
      transform: translateY(0);
      box-shadow: 0 0px 0px rgba(0, 0, 0, 0);
      }
      45% {
      transform: translateY(-2px); /* Ligeramente más alto que tu ejemplo inicial */
      box-shadow: 0 5px 9px rgba(0, 0, 0, 0.2);
      }
      50% {
      transform: translateY(0); /* Empieza la caída */
      box-shadow: 0 0px 0px rgba(0, 0, 0, 0);
      }
      60% {
      transform: translateY(-1.5px); /* Simula tocar el fondo (ajusta si es necesario) */
      box-shadow: 0 4.5px 7px rgba(0, 0, 0, 0.2); /* Sombra más fuerte al caer */
      }
      65% {
      transform: translateY(0); /* Primer rebote más alto */
      box-shadow: 0 0px 0px rgba(0, 0, 0, 0);
      }
      68% {
      transform: translateY(-1px);
      box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
      }
      70% {
      transform: translateY(0); /* Primer rebote más alto */
      box-shadow: 0 0px 0px rgba(0, 0, 0, 0);
      }
      71% {
        transform: translateY(0.25px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
      72% {
        transform: translateY(0); /* Primer rebote más alto */
        box-shadow: 0 0px 0px rgba(0, 0, 0, 0);
      }
    }

    #horarios-slider-automatic{
      ${hasHorariosGenerados ? "" : "display: none;"}
    }

    .horarios-slider{
      display: flex;
      flex-direction: row;
      gap: 9px;
      overflow-x: scroll;
      align-items: stretch;
      scroll-snap-type: x mandatory;
    }

    .horarios-slider > * {
      scroll-snap-align: center;
    }

    .horario{
      display: flex;
      flex-direction: column;
    }

    .horario table {
      font-size: 11px;
      border-collapse: collapse;
      border-radius: 9px;
      box-shadow: 0 0 9px rgba(0, 0, 0, 0.2);
      margin: 9px;
      height: 100%;
      overflow: hidden;
    }

    .horario th, .horario td {
      text-align: center;
      vertical-align: middle;
    }

    .horario tr {
      padding: 5px 0;
      background: white;
    }

    .horario tr:nth-child(even) {
      background: #f0f0f0;
    }

    .horario th {
      background: #D90452; 
      color: white;
    }

    #credits {
      font-weight: bold;
    }

    .button-micro{
      border-radius: 100%;
      font-size: 9px;
      font-weight: bold;
      color: white;
      padding: 6.5px 8px;
      background: #D90452;
      cursor: pointer;
      transition: box-shadow 0.5s ease, transform 0.5s ease;
    }

    .button-micro:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 9px rgba(0, 0, 0, 0.4);
    }

    #manual-container {
      display: flex;
      flex-direction: column;
      gap: 10px;

      ${isManual ? "" : "display: none;"}
    }

    #guardados-container {
      ${hasHorariosGuardados ? "" : "display: none;"}
    }

    .horarios-container {
      margin-top: 10px;
      background-color: #f0f0f0;
      border-radius: 9px;
      overflow: hidden;
      box-shadow: inset 0 0px 9px rgba(0,0,0,0.12);
    }

    .button-mini {
      border-radius: 9px;
      font-size: 11px;
      background: #f0f0f0;
      padding: 6.5px 8px;
      cursor: pointer;
      transition: box-shadow 0.5s ease, transform 0.5s ease;
    }

    .button-mini:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 9px rgba(0, 0, 0, 0.2);
    }

    ${MultiSelectTagStyles}
  `;

  // Crear un elemento de estilo
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  // Insertar el elemento de estilo en el head del documento
  document.head.appendChild(styleElement);
}

function setupButtonStartAutomatic() {
  const { buttonStartAutomatic } = getComponents();

  buttonStartAutomatic.addEventListener("click", startAutomatic);
}

function setupButtonStartManual() {
  const { buttonStartManual } = getComponents();

  buttonStartManual.addEventListener("click", startManual);
}

function getComponents() {
  return {
    loadingOverlay: document.getElementById("loading-overlay"),
    panelContainer: document.getElementById("panel-container"),
    panelTitle: document.getElementById("panel-title"),
    initialContainer: document.getElementById("initial-container"),
    buttonStartAutomatic: document.getElementById("button-start-automatic"),
    buttonStartManual: document.getElementById("button-start-manual"),
    automaticContainer: document.getElementById("automatic-container"),
    carreraLabel: document.getElementById("carrera-label"),
    carreraSelect: document.getElementById("carrera-select"),
    planLabel: document.getElementById("plan-label"),
    planSelect: document.getElementById("plan-select"),
    asignaturasLabel: document.getElementById("asignaturas-label"),
    asignaturasSelect: document.getElementById("asignaturas-select"),
    buttonGenerateAutomatic: document.getElementById(
      "button-generate-automatic"
    ),
    warning: document.getElementById("warning"),
    buttonUpdateAutomatic: document.getElementById("button-automatic-update"),
    buttonFinishAutomatic: document.getElementById("button-automatic-finish"),
    buttonFinishManual: document.getElementById("button-manual-finish"),
    horariosGeneradosSlider: document.getElementById(
      "horarios-slider-automatic"
    ),
    horariosSeleccionadoSlider: document.getElementById(
      "horarios-slider-manual"
    ),
    horariosGuardadosSlider: document.getElementById(
      "horarios-slider-guardados"
    ),
  };
}

function getSAEScomponents() {
  return {
    SAESform: document.getElementById("aspnetForm"),
    SAESvisualizarButton: document.getElementById(
      "ctl00_mainCopy_cmdVisalizar"
    ),
    SAEScarreraSelect: document.getElementById(
      "ctl00_mainCopy_Filtro_cboCarrera"
    ),
    SAESplanSelect: document.getElementById(
      "ctl00_mainCopy_Filtro_cboPlanEstud"
    ),
    SAESturnoSelect: document.getElementById("ctl00_mainCopy_Filtro_cboTurno"),
    SAESperiodoSelect: document.getElementById(
      "ctl00_mainCopy_Filtro_lsNoPeriodos"
    ),
    SAEShorariosTable:
      document.getElementById("ctl00_mainCopy_dbgHorarios") ||
      document.getElementById("regs"), // Compatibilidad con MODS SAES anterior
  };
}

function startAutomatic(event) {
  event.preventDefault();

  // Bandera para indicar que se ha iniciado el proceso de generación automática
  chrome.storage.local.set({ isAutomatic: true });

  // Recargar la página para aplicar los cambios
  window.location.reload();
}

function startManual(event) {
  event.preventDefault();

  // Bandera para indicar que se ha iniciado el proceso de generación automática
  chrome.storage.local.set({ isManual: true });

  // Recargar la página para aplicar los cambios
  window.location.reload();
}

async function automaticController() {
  // Obtener elementos del SAES
  const { SAEScarreraSelect, SAESplanSelect } = getSAEScomponents();

  // Configurar botón de finalizar
  setupButtonFinishAutomatic();

  // Obtener las carreras disponibles y guardarlas en el almacenamiento local
  const carreras = getSelectorOptions(SAEScarreraSelect);

  // Obtener carrera seleccionada previamente
  const selectedCarrera = (await chrome.storage.local.get("selectedCarrera"))
    .selectedCarrera;

  // Configurar el select de carreras
  setupCarreraSelect(carreras, selectedCarrera);

  // Si ya se seleccionó una carrera
  if (selectedCarrera) {
    // Seleccionar la carrera en el SAES
    if (SAEScarreraSelect.value !== selectedCarrera)
      changeSelectorValue(SAEScarreraSelect, selectedCarrera);

    // Obtener los planes de estudio disponibles
    const planes = getSelectorOptions(SAESplanSelect);

    // Obtener el plan de estudio seleccionado previamente
    const selectedPlan = (await chrome.storage.local.get("selectedPlan"))
      .selectedPlan;

    // Configurar el select de planes de estudio
    setupPlanSelect(planes, selectedPlan);

    // Si ya se seleccionó un plan de estudio
    if (selectedPlan) {
      // Se realiza el escaneo de las clases si no se ha hecho antes o si se ha cambiado de carrera o plan
      await clasesScanner();

      // Configurar botón de actualizar
      setupButtonUpdateAutomatic();

      // Verificar si se ha completado el escaneo de clases
      const isScanCompleted = !(await chrome.storage.local.get("isScanning"))
        .isScanning;

      // Si se ha completado el escaneo
      if (isScanCompleted) {
        // Obtener las asignaturas escaneadas
        const asignaturas = (await chrome.storage.local.get("dataAsignaturas"))
          .dataAsignaturas;

        // Obtener las asignaturas seleccionadas previamente
        const selectedAsignaturas =
          (await chrome.storage.local.get("selectedAsignaturas"))
            .selectedAsignaturas || [];

        // Configurar el select de asignaturas
        setupAsignaturasSelect(asignaturas, selectedAsignaturas);

        // Configurar el formulario de generación de horarios
        setupButtonGenerateAutomatic();

        // Obtener los horarios generados previamente
        const horariosGenerados =
          (await chrome.storage.local.get("userHorariosGenerados"))
            .userHorariosGenerados || [];

        // Si hay horarios generados, mostrarlos
        if (horariosGenerados.length > 0) {
          setupContainerHorariosGenerados(horariosGenerados, asignaturas);
        }
      }
    }
  }
}

function getSelectorOptions(selector) {
  return Array.from(selector.options).map((option) => {
    return { value: option.value, text: option.textContent.trim() };
  });
}

function changeSelectorValue(selector, value) {
  // Seleccionar la value en el selector
  Array.from(selector.options).forEach((option) => {
    if (option.value === value) {
      option.selected = "selected"; // Seleccionar la opción
      selector.dispatchEvent(new Event("change")); // Disparar el evento de cambio, esto recarga la página
    }
  });
}

async function setupCarreraSelect(carreras, defaultCarrera) {
  const { carreraSelect } = getComponents();
  const { SAEScarreraSelect } = getSAEScomponents();

  // Cargar las carreras en el select de carreras
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Selecciona una carrera";
  carreraSelect.appendChild(defaultOption);

  carreras.forEach((carrera) => {
    const option = document.createElement("option");
    option.value = carrera.value;
    option.textContent = carrera.text;
    if (defaultCarrera && carrera.value === defaultCarrera) {
      option.selected = true;
    }
    carreraSelect.appendChild(option);
  });

  // Si no hay defaultCarrera, seleccionar defaultOption
  if (!defaultCarrera) {
    defaultOption.selected = true;
  }

  // Escuchasr cambios en el select de carreras
  carreraSelect.addEventListener("change", (event) => {
    const selectedCarrera = event.target.value;
    if (selectedCarrera == "") return;

    // Guardar la carrera seleccionada en el almacenamiento local
    chrome.storage.local.set({ selectedCarrera });

    // Eliminar seleccion de plan de estudio
    chrome.storage.local.remove("selectedPlan");

    // Limpiar las clases escaneadas
    chrome.storage.local.remove("dataClases");

    // Limpiar las asignaturas escaneadas
    chrome.storage.local.remove("dataAsignaturas");
    chrome.storage.local.remove("selectedAsignaturas");

    // Limpiar los turnos y periodos pendientes
    chrome.storage.local.remove("pendingTurnos");
    chrome.storage.local.remove("pendingPeriodos");

    // Limpiar los horarios generados
    chrome.storage.local.remove("userHorariosGenerados");

    // Seleccionar la carrera en el SAES
    changeSelectorValue(SAEScarreraSelect, selectedCarrera); // Esto recarga la página
  });
}

async function setupPlanSelect(planes, defaultPlan) {
  const { planLabel, planSelect } = getComponents();
  const { SAESplanSelect } = getSAEScomponents();

  // Mostrar el label y selector de plan de estudio
  planLabel.hidden = false;
  planSelect.hidden = false;

  // Cargar los planes de estudio en el select de planes
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Selecciona un plan de estudio";
  planSelect.appendChild(defaultOption);

  planes.forEach((plan) => {
    const option = document.createElement("option");
    option.value = plan.value;
    option.textContent = plan.text;
    if (defaultPlan && plan.value === defaultPlan) {
      option.selected = true;
    }
    planSelect.appendChild(option);
  });

  // Si no hay defaultPlan, seleccionar defaultOption
  if (!defaultPlan) {
    defaultOption.selected = true;
  }

  // Escuchar cambios en el select de planes
  planSelect.addEventListener("change", (event) => {
    const selectedPlan = event.target.value;
    if (selectedPlan == "") return;

    // Guardar la carrera seleccionada en el almacenamiento local
    chrome.storage.local.set({ selectedPlan });

    // Limpiar las clases escaneadas
    chrome.storage.local.remove("dataClases");

    // Limpiar los turnos y periodos pendientes
    chrome.storage.local.remove("pendingTurnos");
    chrome.storage.local.remove("pendingPeriodos");

    // Limpiar los horarios generados
    chrome.storage.local.remove("userHorariosGenerados");

    // Seleccionar la carrera en el SAES
    changeSelectorValue(SAESplanSelect, selectedPlan); // Esto recarga la página
  });
}

async function clasesScanner() {
  const { SAESturnoSelect, SAESperiodoSelect, SAEShorariosTable } =
    getSAEScomponents();
  const { loadingOverlay } = getComponents();
  loadingOverlay.style.display = "flex"; // Mostrar overlay de carga

  // Obtener los turnos pendientes de escanear
  let pendingTurnos = (await chrome.storage.local.get("pendingTurnos"))
    .pendingTurnos;
  // Si no se han generado los turnos pendientes, obtenerlos del select de turnos
  if (!pendingTurnos) {
    pendingTurnos = getSelectorOptions(SAESturnoSelect);

    // Colocarse en el primer turno pendiente
    const currentTurno = pendingTurnos.pop();
    chrome.storage.local.set({ pendingTurnos });

    // Bandera para indicar que el escaneo está activo
    chrome.storage.local.set({ isScanning: true });

    // Cambiar al primer turno pendiente
    changeSelectorValue(SAESturnoSelect, currentTurno.value); // Esto recarga la página
    return; // Evitar que se ejecute el resto del código
  }

  // Obtener los periodos pendientes de escanear
  let pendingPeriodos = (await chrome.storage.local.get("pendingPeriodos"))
    .pendingPeriodos;
  // Si no se han generado los periodos pendientes, obtenerlos del select de periodos
  if (!pendingPeriodos) {
    pendingPeriodos = getSelectorOptions(SAESperiodoSelect);

    // Colocarse en el primer periodo pendiente
    const currentPeriodo = pendingPeriodos.pop();
    chrome.storage.local.set({ pendingPeriodos });

    // Bandera para indicar que el escaneo está activo
    chrome.storage.local.set({ isScanning: true });

    // Cambiar al primer periodo pendiente
    changeSelectorValue(SAESperiodoSelect, currentPeriodo.value); // Esto recarga la página
    return; // Evitar que se ejecute el resto del código
  }

  // Delay para evitar multiples recargas de página por parte del SAES
  //await new Promise((resolve) => setTimeout(resolve, 750));
  const isScanning = (await chrome.storage.local.get("isScanning")).isScanning;
  if (isScanning && SAEShorariosTable)
    await scannHorariosTable(SAEShorariosTable); // Escanear la tabla de horarios si existe

  let currentTurno;
  // Sacar el siguiente periodo pendiente
  const currentPeriodo = pendingPeriodos.pop() ?? null;
  chrome.storage.local.set({ pendingPeriodos });
  if (!currentPeriodo) {
    // Si no hay periodos pendientes, pasar al siguiente turno
    currentTurno = pendingTurnos.pop() ?? null;
    chrome.storage.local.set({ pendingTurnos });

    if (!currentTurno) {
      // Si no hay turnos pendientes, finalizar el escaneo
      chrome.storage.local.set({ isScanning: false });
      loadingOverlay.style.display = "none"; // Mostrar overlay de carga

      return;
    } else {
      chrome.storage.local.remove("pendingPeriodos"); // Forzar el escaneo de periodos en el siguiente turno
    }
  }

  // Pasar al siguiente periodo
  if (currentPeriodo)
    changeSelectorValue(SAESperiodoSelect, currentPeriodo.value);
  // Esto recarga la página
  else {
    // Pasar al siguiente turno si ya no hay periodos pendientes para el turno actual
    changeSelectorValue(SAESturnoSelect, currentTurno.value); // Esto recarga la página
  }
}

async function scannHorariosTable(horariosTable) {
  // Recuperar las clases ya escaneadas o inicializar un array vacío
  let clases = (await chrome.storage.local.get("dataClases")).dataClases || [];

  // Recuperar las asignaturas ya escaneadas o inicializar un array vacío
  let asignaturas =
    (await chrome.storage.local.get("dataAsignaturas")).dataAsignaturas || [];

  // Obtener las filas de la tabla de horarios
  let horariosRows = horariosTable
    .getElementsByTagName("tbody")[0]
    .getElementsByTagName("tr");

  // Quitar la primera fila (encabezado de la tabla)
  horariosRows = Array.from(horariosRows).slice(1);

  // Escanear las filas de la tabla de horarios
  for (let row of horariosRows) {
    // Obtener las columnas de la fila actual
    let columns = row.getElementsByTagName("td");

    // Extraer los datos de las columnas
    let clase = {
      id: clases.length,
      grupo: columns[0].textContent.trim(),
      asignatura: columns[1].textContent.trim(),
      profesor: columns[2].textContent.trim(),
      horas: {
        lunes: columns[5].textContent.trim(),
        martes: columns[6].textContent.trim(),
        miercoles: columns[7].textContent.trim(),
        jueves: columns[8].textContent.trim(),
        viernes: columns[9].textContent.trim(),
      },
    };

    // Buscar si la asignatura ya existe en el array de asignaturas
    let asignaturaIndex = asignaturas.findIndex(
      (a) => a.text == clase.asignatura
    );
    // Si no existe, se agrega al array de asignaturas
    if (asignaturaIndex == -1) {
      asignaturaIndex = asignaturas.length;

      let asignatura = {
        text: clase.asignatura,
        value: asignaturaIndex,
      };

      asignaturas.push(asignatura);
    }

    // Almacenar solo el índice de la asignatura en la clase
    clase.asignatura = asignaturaIndex;

    // Agregar la clase al array de clases
    clases.push(clase);
  }

  // Actualizar clases escaneadas
  chrome.storage.local.set({ dataClases: clases });

  // Actualizar asignaturas escaneadas
  chrome.storage.local.set({ dataAsignaturas: asignaturas });
}

function setupButtonUpdateAutomatic() {
  const { buttonUpdateAutomatic } = getComponents();

  buttonUpdateAutomatic.addEventListener("click", (event) => {
    event.preventDefault();

    chrome.storage.local.remove("pendingPeriodos");
    chrome.storage.local.remove("pendingTurnos");
    chrome.storage.local.remove("dataClases");
    chrome.storage.local.remove("dataAsignaturas");
    chrome.storage.local.remove("selectedAsignaturas");
    chrome.storage.local.remove("userHorariosGenerados");

    window.location.reload();
  });
}

function setupButtonFinishAutomatic() {
  const { buttonFinishAutomatic } = getComponents();

  buttonFinishAutomatic.addEventListener("click", (event) => {
    event.preventDefault();

    chrome.storage.local.remove("pendingPeriodos");
    chrome.storage.local.remove("pendingTurnos");
    chrome.storage.local.remove("dataClases");
    chrome.storage.local.remove("dataAsignaturas");
    chrome.storage.local.remove("selectedAsignaturas");
    chrome.storage.local.remove("userHorariosGenerados");
    chrome.storage.local.set({ isAutomatic: false });

    window.location.reload();
  });
}

function setupAsignaturasSelect(asignaturas, selectedAsignaturas) {
  const { asignaturasSelect } = getComponents();

  // Cargar las asignaturas en el select de asignaturas
  asignaturas.forEach((asignatura) => {
    const option = document.createElement("option");
    option.value = asignatura.value;
    option.textContent = asignatura.text;
    if (selectedAsignaturas.includes(asignatura.value.toString())) {
      option.selected = true; // Marcar como seleccionado si está en el array de asignaturas seleccionadas
    }
    asignaturasSelect.appendChild(option);
  });

  // Escuchar cambios en el select de asignaturas
  asignaturasSelect.addEventListener("change", (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions).map(
      (option) => option.value
    );

    // Guardar las asignaturas seleccionadas en el almacenamiento local
    //chrome.storage.local.set({ selectedAsignaturas: selectedOptions }); // Reemplazado por gurdar cada que se genera un horario
  });

  // Crear elemento de interfaz MultiSelectTag
  MultiSelectTag("asignaturas-select");
}

function MultiSelectTag(el, customs = { shadow: false, rounded: true }) {
  var element = null;
  var options = null;
  var customSelectContainer = null;
  var wrapper = null;
  var btnContainer = null;
  var body = null;
  var inputContainer = null;
  var inputBody = null;
  var input = null;
  var button = null;
  var drawer = null;
  var ul = null;
  var domParser = new DOMParser();
  init();

  function init() {
    element = document.getElementById(el);
    createElements();
    initOptions();
    enableItemSelection();
    setValues(false);

    body.addEventListener("click", () => {
      if (drawer.classList.contains("hidden")) {
        initOptions();
        enableItemSelection();
        drawer.classList.remove("hidden");
        input.focus();
      }
    });

    input.addEventListener("keyup", (e) => {
      initOptions(e.target.value);
      enableItemSelection();
    });

    input.addEventListener("keydown", (e) => {
      if (
        e.key === "Backspace" &&
        !e.target.value &&
        inputContainer.childElementCount > 1
      ) {
        const child =
          body.children[inputContainer.childElementCount - 2].firstChild;
        const option = options.find((op) => op.value == child.dataset.value);
        option.selected = false;
        removeTag(child.dataset.value);
        setValues();
      }
    });

    window.addEventListener("click", (e) => {
      if (!customSelectContainer.contains(e.target)) {
        drawer.classList.add("hidden");
      }
    });
  }

  function createElements() {
    // Create custom elements
    options = getOptions();
    element.classList.add("hidden");

    // .multi-select-tag
    customSelectContainer = document.createElement("div");
    customSelectContainer.classList.add("mult-select-tag");

    // .container
    wrapper = document.createElement("div");
    wrapper.classList.add("wrapper");

    // body
    body = document.createElement("div");
    body.classList.add("body");
    if (customs.shadow) {
      body.classList.add("shadow");
    }
    if (customs.rounded) {
      body.classList.add("rounded");
    }

    // .input-container
    inputContainer = document.createElement("div");
    inputContainer.classList.add("input-container");

    // input
    input = document.createElement("input");
    input.classList.add("input");
    input.placeholder = `${customs.placeholder || "Buscar..."}`;

    inputBody = document.createElement("inputBody");
    inputBody.classList.add("input-body");
    inputBody.append(input);

    body.append(inputContainer);

    // .btn-container
    btnContainer = document.createElement("div");
    btnContainer.classList.add("btn-container");

    // button
    button = document.createElement("button");
    button.type = "button";
    btnContainer.append(button);

    const icon = domParser.parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 21 6 15"></polyline></svg>`,
      "image/svg+xml"
    ).documentElement;
    button.append(icon);

    body.append(btnContainer);
    wrapper.append(body);

    drawer = document.createElement("div");
    drawer.classList.add(...["drawer", "hidden"]);
    if (customs.shadow) {
      drawer.classList.add("shadow");
    }
    if (customs.rounded) {
      drawer.classList.add("rounded");
    }
    drawer.append(inputBody);
    ul = document.createElement("ul");

    drawer.appendChild(ul);

    customSelectContainer.appendChild(wrapper);
    customSelectContainer.appendChild(drawer);

    // Place TailwindTagSelection after the element
    if (element.nextSibling) {
      element.parentNode.insertBefore(
        customSelectContainer,
        element.nextSibling
      );
    } else {
      element.parentNode.appendChild(customSelectContainer);
    }
  }

  function initOptions(val = null) {
    ul.innerHTML = "";
    for (var option of options) {
      if (option.selected) {
        !isTagSelected(option.value) && createTag(option);
      } else {
        const li = document.createElement("li");
        li.innerHTML = option.label;
        li.dataset.value = option.value;

        // For search
        if (
          val &&
          option.label
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase()
            .includes(
              val
                .normalize("NFD")
                .replace(/\p{Diacritic}/gu, "")
                .toLowerCase()
            )
        ) {
          ul.appendChild(li);
        } else if (!val) {
          ul.appendChild(li);
        }
      }
    }
  }

  function createTag(option) {
    // Create and show selected item as tag
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("item-container");
    const itemLabel = document.createElement("div");
    itemLabel.classList.add("item-label");
    itemLabel.innerHTML = option.label;
    itemLabel.dataset.value = option.value;
    const itemClose = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="item-close-svg">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>`,
      "image/svg+xml"
    ).documentElement;

    itemClose.addEventListener("click", (e) => {
      const unselectOption = options.find((op) => op.value == option.value);
      unselectOption.selected = false;
      removeTag(option.value);
      initOptions();
      setValues();
      element.dispatchEvent(new Event("change"));
    });

    itemDiv.appendChild(itemLabel);
    itemDiv.appendChild(itemClose);
    inputContainer.append(itemDiv);
  }

  function enableItemSelection() {
    // Add click listener to the list items
    for (var li of ul.children) {
      li.addEventListener("click", (e) => {
        options.find((o) => o.value == e.target.dataset.value).selected = true;
        input.value = null;
        initOptions();
        setValues();
        element.dispatchEvent(new Event("change"));
        input.focus();
      });
    }
  }

  function isTagSelected(val) {
    // If the item is already selected
    for (var child of inputContainer.children) {
      if (
        !child.classList.contains("input-body") &&
        child.firstChild.dataset.value == val
      ) {
        return true;
      }
    }
    return false;
  }
  function removeTag(val) {
    // Remove selected item
    for (var child of inputContainer.children) {
      if (
        !child.classList.contains("input-body") &&
        child.firstChild.dataset.value == val
      ) {
        inputContainer.removeChild(child);
      }
    }
  }
  function setValues(fireEvent = true) {
    // Update element final values
    selected_values = [];
    for (var i = 0; i < options.length; i++) {
      element.options[i].selected = options[i].selected;
      if (options[i].selected) {
        selected_values.push({
          label: options[i].label,
          value: options[i].value,
        });
      }
    }
    if (fireEvent && customs.hasOwnProperty("onChange")) {
      customs.onChange(selected_values);
    }
  }
  function getOptions() {
    // Map element options
    return [...element.options].map((op) => {
      return {
        value: op.value,
        label: op.label,
        selected: op.selected,
      };
    });
  }
}

function setupButtonGenerateAutomatic() {
  const {
    buttonGenerateAutomatic,
    asignaturasSelect,
    warning,
    horariosGeneradosSlider,
  } = getComponents();

  buttonGenerateAutomatic.addEventListener("click", async (event) => {
    // Evitar que se recargue la página
    event.preventDefault();

    // Mostrar un mensaje de carga
    warning.style.display = "flex";

    // Ocultar el slider de horarios generados mientras se generan nuevos horarios
    horariosGeneradosSlider.style.display = "none";

    // Limpiar las clases eliminadas
    chrome.storage.local.set({ userClasesEliminadas: [] });

    // Obtener las asignaturas seleccionados
    const selectedAsignaturas = Array.from(
      asignaturasSelect.selectedOptions
    ).map((option) => option.value);

    // Si no hay asignaturas seleccionadas, no hacer nada
    if (selectedAsignaturas.length === 0) return;

    // Guardar las asignaturas seleccionadas en el almacenamiento local
    chrome.storage.local.set({ selectedAsignaturas });

    // Generar los horarios
    const horarios = await generateHorarios(selectedAsignaturas);

    // Guardar los horarios generados en el almacenamiento local
    chrome.storage.local.set({ userHorariosGenerados: horarios });

    // Recargar la página para mostrar los resultados
    window.location.reload();
  });
}

async function generateHorarios(selectedAsignaturas, clasesEliminadas = []) {
  // Obtener las clases escaneadas
  const clases =
    (await chrome.storage.local.get("dataClases")).dataClases || [];

  // Obtener solo las clases que coinciden con las asignaturas seleccionadas
  const filteredClases = filtrarClases(
    clases,
    selectedAsignaturas,
    clasesEliminadas
  );

  // Generar horarios con todas las combinaciones de clases posibles
  const horarios = getHorarios(filteredClases);

  // Ordenar los horarios de menor a mayor cantidad de horas libres
  const horariosOrdenados = horarios.sort(
    (a, b) => a.horasLibres - b.horasLibres
  );

  return horariosOrdenados;
}

function filtrarClases(clases, asignaturas, clasesEliminadas = []) {
  // Arreglo para almacenar los arreglos de clases de cada asignatura
  let filteredClases = [];

  // Se recorre cada asignatura seleccionada
  for (const asignatura of asignaturas) {
    // Cada arreglo dentro de filteredClases representa a una asignatura
    filteredClases.push([]);

    // Se recorre cada clase y se verifica si la asignatura coincide con la asignatura actual
    for (const clase of clases) {
      if (
        clase.asignatura == asignatura &&
        !clasesEliminadas.includes(clase.id)
      ) {
        // Se agrega la clase al arreglo de la asignatura actual
        filteredClases[filteredClases.length - 1].push(clase);
      }
    }
  }

  return filteredClases;
}

function getHorarios(clasesFiltradas) {
  let horarios = [];

  // Contar el total de combinaciones posibles
  const totalCombinations = countCombinations(clasesFiltradas);

  // Si el total de combinaciones es menor o igual a 1 millón, generar todas las combinaciones
  if (totalCombinations <= 1_000_000) {
    horarios = generateAllCombinations(clasesFiltradas);
  } else {
    // Si el total de combinaciones es mayor a 1 millón, generar combinaciones aleatorias
    horarios = generateRandomCombinations(clasesFiltradas, totalCombinations);
  }

  return horarios;
}

function countCombinations(clasesFiltradas) {
  let combinations = 1;
  for (let i = 0; i < clasesFiltradas.length; i++) {
    const size = clasesFiltradas[i]?.length ?? 0;
    combinations *= size;
  }
  return combinations;
}

function generateAllCombinations(clasesFiltradas) {
  let horarios = [];
  let forbiddenPairsOfClases = [];
  let worstHorario = {
    index: -1,
    horasLibres: -1,
  };

  function generateCombinations(clasesArray, currentIndex) {
    // Verificar si la asignatura actual tiene clases
    if (clasesFiltradas[currentIndex].length > 0) {
      // Recorrer todas las clases de la asignatura actual
      for (var j = 0; j < clasesFiltradas[currentIndex].length; j++) {
        // Clonar el array de clases para esta combinación
        var newArray = clasesArray.slice(0);
        // Agregar la clase actual al array de clases de esta combinación
        newArray.push(clasesFiltradas[currentIndex][j]);

        // Si la combinación parcial contiene un par prohibido, descartar esta rama
        if (hasForbiddenPair(newArray, forbiddenPairsOfClases)) continue;

        // Verificar si hemos llegado al final de las asignaturas
        if (currentIndex === clasesFiltradas.length - 1) {
          // Si es así, verificar que no tenga traslapes antes de agregar esta combinación a los horarios
          let traslapes = checkTraslapes(newArray);

          // Si no tiene traslapes, agregar esta combinación a los horarios
          if (!traslapes.tieneTraslapes) {
            // Contar la cantidad de horas libres en el horario
            let horario = {
              clases: newArray,
              horasLibres: countHorasLibres(newArray),
            };

            // Mantener solo los 69 mejores horarios (con menor cantidad de horas libres)
            if (horarios.length >= 69) {
              // Encontrar el peor horario si no se ha encontrado aún
              if (worstHorario.index === -1)
                worstHorario = findWorstHorario(horarios);

              // Comparar el nuevo horario con el peor horario
              if (horario.horasLibres < worstHorario.horasLibres) {
                // Reemplazar el peor horario por el nuevo horario
                horarios[worstHorario.index] = horario;

                // Buscar el nuevo peor horario
                worstHorario = findWorstHorario(horarios);
              }
            } else {
              // Agregar el horario al array de horarios
              horarios.push(horario);
            }
          } else {
            // Almacenar las clases que generan traslapes
            forbiddenPairsOfClases.push(...traslapes.clases);
          }
        } else {
          // Si no, continuar generando combinaciones con la siguiente asignatura
          generateCombinations(newArray, currentIndex + 1);
        }
      }
    } else {
      // Si la asignatura actual no tiene clases, simplemente pasar a la siguiente asignatura
      if (currentIndex === clasesFiltradas.length - 1) {
        // Si hemos llegado al final de las asignaturas, agregar la combinación actual a los horarios
        horarios.push(clasesArray.slice(0));
      } else {
        // Si no, continuar generando combinaciones con la siguiente asignatura
        generateCombinations(clasesArray, currentIndex + 1);
      }
    }
  }

  // Iniciar la generación de combinaciones con un array vacío y la primera asignatura
  generateCombinations([], 0);

  return horarios;
}

function generateRandomCombinations(clasesFiltradas, totalCombinations) {
  const n = clasesFiltradas.length;
  const k = 1_000_000;

  let horarios = [];
  let forbiddenPairsOfClases = [];
  let worstHorario = {
    index: -1,
    horasLibres: -1,
  };

  // Generar k índices aleatorios ÚNICOS (solo números, no combinaciones)
  const used = new Set();

  while (used.size < k) {
    const idx = Math.floor(Math.random() * totalCombinations);
    used.add(idx); // si ya estaba, Set no crece; seguimos intentando
  }

  // Recorrer cada índice único y convertirlo a una combinación (1 elemento por grupo)
  for (const idx0 of used) {
    let idx = idx0;

    // Convertimos "idx" a una selección de 1 elemento por grupo
    // usando "base mixta": cada grupo tiene base = tamaño del grupo.
    const combo = new Array(n);

    for (let i = n - 1; i >= 0; i--) {
      const size = clasesFiltradas[i].length;

      const pickIndex = idx % size; // qué elemento tomamos del grupo i
      combo[i] = clasesFiltradas[i][pickIndex]; // el elemento elegido

      idx = Math.floor(idx / size); // reducimos el índice para el siguiente grupo
    }

    // combo = [1 clase de la asignatura 0, 1 de la asignatura 1, ...]

    // Si la combinación parcial contiene un par prohibido, descartar esta rama
    if (hasForbiddenPair(combo, forbiddenPairsOfClases)) continue;

    // Verificar que no tenga traslapes antes de agregar esta combinación a los horarios
    let traslapes = checkTraslapes(combo);

    if (traslapes.tieneTraslapes) {
      // Almacenar las clases que generan traslapes
      forbiddenPairsOfClases.push(...traslapes.clases);
    } else {
      // Contar la cantidad de horas libres en el horario
      let horario = {
        clases: combo,
        horasLibres: countHorasLibres(combo),
      };

      // Mantener solo los 69 mejores horarios (con menor cantidad de horas libres)
      if (horarios.length >= 69) {
        // Encontrar el peor horario si no se ha encontrado aún
        if (worstHorario.index === -1)
          worstHorario = findWorstHorario(horarios);

        // Comparar el nuevo horario con el peor horario
        if (horario.horasLibres < worstHorario.horasLibres) {
          // Si el nuevo horario es mejor, reemplazar el peor horario por el nuevo horario
          horarios[worstHorario.index] = horario;

          // Buscar el nuevo peor horario
          worstHorario = findWorstHorario(horarios);
        }
      } else {
        // Agregar el horario al array de horarios
        horarios.push(horario);
      }
    }
  }

  return horarios;
}

function hasForbiddenPair(clasesArray, forbiddenPairsOfClases) {
  // Obtener los ids presentes en la combinación parcial
  const ids = new Set(clasesArray.map((c) => c.id));

  // Revisar cada par prohibido
  for (const [id1, id2] of forbiddenPairsOfClases) {
    if (ids.has(id1) && ids.has(id2)) {
      return true; // combinación inválida
    }
  }

  return false; // combinación válida
}

function findWorstHorario(horarios) {
  let worstHorario = {
    index: -1,
    horasLibres: -1,
  };

  for (let i = 0; i < horarios.length; i++) {
    if (horarios[i].horasLibres > worstHorario.horasLibres) {
      worstHorario.horasLibres = horarios[i].horasLibres;
      worstHorario.index = i;
    }
  }

  return worstHorario;
}

function checkTraslapes(horario) {
  // Función para verificar si dos intervalos se traslapan
  function seTraslapan(inicio1, final1, inicio2, final2) {
    // Función para convertir una cadena de tiempo "HH:mm" a minutos
    function convertirAMinutos(hora) {
      const [hh, mm] = hora.split(":").map(Number);
      return hh * 60 + mm;
    }

    // Convertir todas las horas a minutos
    const inicio1Min = convertirAMinutos(inicio1);
    const final1Min = convertirAMinutos(final1);
    const inicio2Min = convertirAMinutos(inicio2);
    const final2Min = convertirAMinutos(final2);

    // Verificar si los intervalos se traslapan
    return inicio1Min < final2Min && final1Min > inicio2Min;
  }

  // Variable para indicar si se encontraron traslapes
  let traslapes = {
    tieneTraslapes: false,
    clases: [],
  };

  // Objeto para agrupar los horarios por día
  const horasPorDia = {};

  // Organizar los horarios por día
  horario.forEach((clase) => {
    Object.entries(clase.horas).forEach(([dia, hora]) => {
      if (hora === "") return; // Si no hay hora, saltar

      // Si el día no existe en horasPorDia, inicializarlo
      if (!horasPorDia[dia]) {
        horasPorDia[dia] = [];
      }

      // Agregar la clase al día correspondiente
      horasPorDia[dia].push({
        id: clase.id,
        inicio: hora.split("-")[0].trim(),
        final: hora.split("-")[1].trim(),
      });
    });
  });

  // Verificar traslapes en cada día
  for (const dia in horasPorDia) {
    const horasDia = horasPorDia[dia];

    for (let j = 0; j < horasDia.length; j++) {
      for (let k = j + 1; k < horasDia.length; k++) {
        const hora1 = horasDia[j];
        const hora2 = horasDia[k];

        if (
          hora1.id !== hora2.id &&
          seTraslapan(hora1.inicio, hora1.final, hora2.inicio, hora2.final)
        ) {
          // Se detectó un traslape entre hora1.id y hora2.id
          traslapes.tieneTraslapes = true;

          // Almacenar las clases que se traslapan
          traslapes.clases.push([hora1.id, hora2.id]);
          //break;
        }
      }
      //if (traslapes.tieneTraslapes) break;
    }
    //if (traslapes.tieneTraslapes) break;
  }

  return traslapes;
}

function countHorasLibres(horario) {
  // Función para convertir una hora en formato "HH:MM" a minutos
  function convertirAMinutos(hora) {
    const [horas, minutos] = hora.split(":").map(Number);
    return horas * 60 + minutos;
  }

  // Función para convertir minutos a horas decimales
  function convertirAHorasDecimales(minutos) {
    return minutos / 60;
  }

  // Objeto para almacenar las horas ocupadas y rangos por día
  const horasPorDia = {};

  // Calcular horas ocupadas y rangos por día
  horario.forEach((clase) => {
    Object.entries(clase.horas).forEach(([dia, hora]) => {
      if (hora === "") return; // Si no hay hora, saltar
      const inicio = convertirAMinutos(hora.split("-")[0].trim());
      const final = convertirAMinutos(hora.split("-")[1].trim());

      if (!horasPorDia[dia]) {
        horasPorDia[dia] = {
          horasOcupadas: 0,
          horaInicioDia: inicio,
          horaFinalDia: final,
        };
      } else {
        // Actualizar el rango del día
        if (inicio < horasPorDia[dia].horaInicioDia) {
          horasPorDia[dia].horaInicioDia = inicio;
        }
        if (final > horasPorDia[dia].horaFinalDia) {
          horasPorDia[dia].horaFinalDia = final;
        }
      }

      // Sumar las horas ocupadas
      horasPorDia[dia].horasOcupadas += final - inicio;
    });
  });

  // Calcular las horas libres por día y el total de horas libres
  let totalHorasLibres = 0;

  for (const dia in horasPorDia) {
    const { horaInicioDia, horaFinalDia, horasOcupadas } = horasPorDia[dia];

    // Calcular las horas totales del día
    const horasTotales = horaFinalDia - horaInicioDia;

    // Calcular las horas libres del día
    const horasLibresDia = horasTotales - horasOcupadas;

    // Sumar al total de horas libres
    totalHorasLibres += convertirAHorasDecimales(horasLibresDia);
  }

  // Devolver las horas libres del horario
  return totalHorasLibres;
}

function setupContainerHorariosGenerados(horariosGenerados, asignaturas) {
  // Obtener el contenedor de horarios generados
  const { horariosGeneradosSlider } = getComponents();

  // Limpiar el contenedor de horarios generados
  horariosGeneradosSlider.innerHTML = "";

  // Si hay más de 100 horarios generados, solo mostrar los primeros 100
  if (horariosGenerados.length > 100) {
    horariosGenerados = horariosGenerados.slice(0, 100);
  }

  // Mostrar los horarios generados
  horariosGenerados.forEach((horario, index) => {
    const horarioDiv = document.createElement("div");
    horarioDiv.className = "horario";
    horarioDiv.innerHTML = `<h3>Horario ${index + 1}</h3>`;
    horarioDiv.innerHTML += `<p>Horas libres: ${horario.horasLibres}</p>`; // Si se usa innerHTML después de appendChild, los eventos de click se perderán

    // Crear tabla
    const table = document.createElement("table");

    //table.style.borderCollapse = "collapse";
    table.innerHTML = `
      <thead>
      <tr>
        <th>Grupo</th>
        <th>Asignatura</th>
        <th>Profesor</th>
        <th>Lun</th>
        <th>Mar</th>
        <th>Mie</th>
        <th>Jue</th>
        <th>Vie</th>
        <th></th>
      </tr>
      </thead>
      <tbody></tbody>
      <tfoot>
        <tr>
          <td id="credits" colspan="9">MODS SAES 2 By ReprobadosDev</td>
        </tr>
      </tfoot>
    `;

    const tbody = table.querySelector("tbody");

    horario.clases.forEach((clase, index) => {
      const row = document.createElement("tr");
      horario.clases[index].asignatura = asignaturas[clase.asignatura].text; // Reemplazar el ID de asignatura por el texto

      row.innerHTML = `
      <td>${clase.grupo}</td>
      <td>${clase.asignatura}</td>
      <td>${clase.profesor}</td>
      <td>${clase.horas.lunes || ""}</td>
      <td>${clase.horas.martes || ""}</td>
      <td>${clase.horas.miercoles || ""}</td>
      <td>${clase.horas.jueves || ""}</td>
      <td>${clase.horas.viernes || ""}</td>
      <td></td>
      `;

      // Crear botón de eliminar clase
      const buttonEliminar = document.createElement("button");
      buttonEliminar.className = "button-micro";
      buttonEliminar.textContent = "X";
      buttonEliminar.addEventListener("click", async () => {
        removeClase(clase.id);
      });

      // Agregar el botón de eliminar a la última celda
      const lastCell = row.querySelector("td:last-child");
      lastCell.appendChild(buttonEliminar);

      // Agregar la fila a la tabla
      tbody.appendChild(row);
    });

    const buttonGuardar = document.createElement("button");
    buttonGuardar.className = "button";
    buttonGuardar.textContent = "Guardar";
    buttonGuardar.addEventListener("click", async () => {
      // Obtener los horarios guardados del almacenamiento local
      let horariosGuardados =
        (await chrome.storage.local.get("userHorariosGuardados"))
          .userHorariosGuardados || [];

      // Marcar origen del horario
      horario.origin = "automatic";

      // Agregar un ID único al horario
      horario.id = Date.now();

      // Agregar el horario actual a los horarios guardados
      horariosGuardados.push(horario);
      // Guardar los horarios actualizados en el almacenamiento local
      await chrome.storage.local.set({
        userHorariosGuardados: horariosGuardados,
      });

      // Recargar la página para mostrar los horarios guardados
      window.location.reload();
    });

    horarioDiv.appendChild(table);
    horarioDiv.appendChild(buttonGuardar);

    horariosGeneradosSlider.appendChild(horarioDiv);
  });
}

async function removeClase(claseId) {
  // Obtener componentes necesarios
  const { warning, horariosGeneradosSlider } = getComponents();

  // Mostrar un mensaje de carga
  warning.style.display = "flex";

  // Ocultar el slider de horarios generados mientras se generan nuevos horarios
  horariosGeneradosSlider.style.display = "none";

  // Obtener las asignaturas seleccionados del almacenamiento local
  const selectedAsignaturas =
    (await chrome.storage.local.get("selectedAsignaturas"))
      .selectedAsignaturas || [];

  // Obtener las clases eliminadas del almacenamiento local
  let clasesEliminadas =
    (await chrome.storage.local.get("userClasesEliminadas"))
      .userClasesEliminadas || [];

  // Agregar la clase eliminada al array
  clasesEliminadas.push(claseId);

  // Guardar las clases eliminadas en el almacenamiento local
  await chrome.storage.local.set({ userClasesEliminadas: clasesEliminadas });

  // Generar los horarios
  const horarios = await generateHorarios(
    selectedAsignaturas,
    clasesEliminadas
  );

  // Guardar los horarios generados en el almacenamiento local
  chrome.storage.local.set({ userHorariosGenerados: horarios });

  // Recargar la página para mostrar los resultados
  window.location.reload();
}

async function manualController() {
  const { SAEShorariosTable } = getSAEScomponents();

  // Configurar botón de finalizar
  setupButtonFinishManual();

  if (SAEShorariosTable) {
    // Configurar tabla de horarios
    setupTableHorarios(SAEShorariosTable);

    // Obtener los horarios seleccionados del almacenamiento local
    const horarioSeleccionado = (
      await chrome.storage.local.get("userHorarioSeleccionado")
    ).userHorarioSeleccionado;

    if (horarioSeleccionado && horarioSeleccionado.clases.length > 0) {
      setupContainerHorarioSeleccionado(horarioSeleccionado);
    }
  }
}

function setupTableHorarios(table) {
  const rows = table.getElementsByTagName("tr");
  // Quitar la primera fila (encabezado de la tabla)
  const rowsArray = Array.from(rows).slice(1);

  // Recorrer las filas de la tabla
  for (let row of rowsArray) {
    // Crear botón de añadir al horario
    const buttonAdd = document.createElement("button");
    buttonAdd.className = "button-micro";
    buttonAdd.textContent = "+";

    // Añadir evento click al botón
    buttonAdd.addEventListener("click", async (event) => {
      event.preventDefault();
      const clase = {
        id: Date.now(), // Usar timestamp como ID único
        grupo: row.cells[0].textContent.trim(),
        asignatura: row.cells[1].textContent.trim(),
        profesor: row.cells[2].textContent.trim(),
        horas: {
          lunes: row.cells[5].textContent.trim(),
          martes: row.cells[6].textContent.trim(),
          miercoles: row.cells[7].textContent.trim(),
          jueves: row.cells[8].textContent.trim(),
          viernes: row.cells[9].textContent.trim(),
        },
      };

      // Guardar la clase en el almacenamiento local
      let horarioSeleccionado = (
        await chrome.storage.local.get("userHorarioSeleccionado")
      ).userHorarioSeleccionado || { clases: [] };
      // Agregar la clase al array de horarios guardados
      horarioSeleccionado.clases.push(clase);

      // Guardar el horario actualizado en el almacenamiento local
      await chrome.storage.local.set({
        userHorarioSeleccionado: horarioSeleccionado,
      });

      // Recargar la página para mostrar los cambios
      window.location.reload();
    });

    // Añadir el botón a la última celda de la fila
    const lastCell = row.insertCell(-1);
    lastCell.appendChild(buttonAdd);
  }
}

function setupContainerHorarioSeleccionado(horarioSeleccionado) {
  // Obtener el contenedor de horario seleccionado
  //const { horarioSeleccionadoSlider } = getComponents(); // No funciona correctamente
  const horarioSeleccionadoSlider = document.getElementById(
    "horarios-slider-manual"
  );

  // Limpiar el contenedor de horario seleccionado
  horarioSeleccionadoSlider.innerHTML = "";

  // Mostrar el horario seleccionado
  const horarioDiv = document.createElement("div");
  horarioDiv.className = "horario";

  // Crear tabla
  const table = document.createElement("table");

  //table.style.borderCollapse = "collapse";
  table.innerHTML = `
      <thead>
      <tr>
        <th>Grupo</th>
        <th>Asignatura</th>
        <th>Profesor</th>
        <th>Lun</th>
        <th>Mar</th>
        <th>Mie</th>
        <th>Jue</th>
        <th>Vie</th>
        <th></th>
      </tr>
      </thead>
      <tbody></tbody>
      <tfoot>
        <tr>
          <td id="credits" colspan="9">MODS SAES 2 By ReprobadosDev</td>
        </tr>
      </tfoot>
    `;

  const tbody = table.querySelector("tbody");

  horarioSeleccionado.clases.forEach((clase) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${clase.grupo}</td>
      <td>${clase.asignatura}</td>
      <td>${clase.profesor}</td>
      <td>${clase.horas.lunes || ""}</td>
      <td>${clase.horas.martes || ""}</td>
      <td>${clase.horas.miercoles || ""}</td>
      <td>${clase.horas.jueves || ""}</td>
      <td>${clase.horas.viernes || ""}</td>
      <td></td>
      `;

    // Crear botón de eliminar clase
    const buttonEliminar = document.createElement("button");
    buttonEliminar.className = "button-micro";
    buttonEliminar.textContent = "X";
    buttonEliminar.addEventListener("click", async () => {
      // Obtener el horario seleccionado del almacenamiento local
      let horarioSeleccionado = (
        await chrome.storage.local.get("userHorarioSeleccionado")
      ).userHorarioSeleccionado;

      // Eliminar la clase con el ID especificado
      const claseId = clase.id;
      horarioSeleccionado.clases = horarioSeleccionado.clases.filter(
        (c) => c.id !== claseId
      );

      // Guardar el horario actualizado en el almacenamiento local
      await chrome.storage.local.set({
        userHorarioSeleccionado: horarioSeleccionado,
      });

      // Recargar la página para mostrar los horarios actualizados
      window.location.reload();
    });

    // Agregar el botón de eliminar a la última celda
    const lastCell = row.querySelector("td:last-child");
    lastCell.appendChild(buttonEliminar);

    // Agregar la fila a la tabla
    tbody.appendChild(row);
  });

  const buttonGuardar = document.createElement("button");
  buttonGuardar.className = "button";
  buttonGuardar.textContent = "Guardar";
  buttonGuardar.addEventListener("click", async () => {
    // Obtener los horarios generados del almacenamiento local
    let horariosGuardados =
      (await chrome.storage.local.get("userHorariosGuardados"))
        .userHorariosGuardados || [];

    // Marcar origen del horario
    horarioSeleccionado.origin = "manual";

    // Agregar un ID único al horario
    horarioSeleccionado.id = Date.now();

    // Agregar el horario actual a los horarios guardados
    horariosGuardados.push(horarioSeleccionado);
    // Guardar los horarios actualizados en el almacenamiento local
    await chrome.storage.local.set({
      userHorariosGuardados: horariosGuardados,
    });

    // Recargar la página para mostrar los horarios guardados
    window.location.reload();
  });

  horarioDiv.appendChild(table);
  horarioDiv.appendChild(buttonGuardar);

  horarioSeleccionadoSlider.appendChild(horarioDiv);
}

function setupButtonFinishManual() {
  const { buttonFinishManual } = getComponents();

  buttonFinishManual.addEventListener("click", (event) => {
    event.preventDefault();

    chrome.storage.local.remove("userHorarioSeleccionado");
    chrome.storage.local.set({ isManual: false });

    window.location.reload();
  });
}

function setupContainerHorariosGuardados(horarios) {
  // Obtener el contenedor de horarios guardados
  const { horariosGuardadosSlider } = getComponents();

  // Limpiar el contenedor de horarios guardados
  horariosGuardadosSlider.innerHTML = "";

  // Mostrar los horarios guardados
  horarios.forEach((horario, index) => {
    const horarioDiv = document.createElement("div");
    horarioDiv.className = "horario";
    horarioDiv.innerHTML = `<h3>Horario ${index + 1}</h3>`;
    horarioDiv.innerHTML +=
      horario.origin == "automatic"
        ? `<p>Horas libres: ${horario.horasLibres}</p>`
        : ""; // Si se usa innerHTML después de appendChild, los eventos de click se perderán

    // Crear tabla
    const table = document.createElement("table");

    //table.style.borderCollapse = "collapse";
    table.innerHTML = `
      <thead>
      <tr>
        <th>Grupo</th>
        <th>Asignatura</th>
        <th>Profesor</th>
        <th>Lun</th>
        <th>Mar</th>
        <th>Mie</th>
        <th>Jue</th>
        <th>Vie</th>
      </tr>
      </thead>
      <tbody></tbody>
      <tfoot>
        <tr>
          <td id="credits" colspan="9">MODS SAES 2 By ReprobadosDev</td>
        </tr>
      </tfoot>
    `;

    horario.clases.forEach((clase) => {
      const row = document.createElement("tr");

      row.innerHTML = `
      <td>${clase.grupo}</td>
      <td>${clase.asignatura}</td>
      <td>${clase.profesor}</td>
      <td>${clase.horas.lunes || ""}</td>
      <td>${clase.horas.martes || ""}</td>
      <td>${clase.horas.miercoles || ""}</td>
      <td>${clase.horas.jueves || ""}</td>
      <td>${clase.horas.viernes || ""}</td>
      `;

      // Agregar la fila a la tabla
      const tbody = table.querySelector("tbody");
      tbody.appendChild(row);
    });

    const buttonEliminarHorario = document.createElement("button");
    buttonEliminarHorario.className = "button";
    buttonEliminarHorario.textContent = "Borrar";
    buttonEliminarHorario.addEventListener("click", async () => {
      removeHorario(horario);
    });
    horarioDiv.appendChild(table);
    horarioDiv.appendChild(buttonEliminarHorario);
    horariosGuardadosSlider.appendChild(horarioDiv);
  });
}

function removeHorario(horario) {
  // Obtener los horarios guardados del almacenamiento local
  chrome.storage.local.get("userHorariosGuardados", (result) => {
    let horariosGuardados = result.userHorariosGuardados;

    // Filtrar el horario a eliminar
    horariosGuardados = horariosGuardados.filter((h) => h.id !== horario.id);

    // Guardar los horarios actualizados en el almacenamiento local
    chrome.storage.local.set({ userHorariosGuardados: horariosGuardados });

    // Recargar la página para mostrar los horarios actualizados
    window.location.reload();
  });
}
