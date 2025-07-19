window.addEventListener("load", async () => {
  // Visualizar información
  const { SAESform, SAESvisualizarButton } = getSAESelements();
  if (SAESvisualizarButton) SAESform.submit();

  // Cargar banderas de control
  loadFlags();

  // Obtener banderas
  const isAutomatic = (await chrome.storage.local.get("isAutomatic"))
    .isAutomatic;

  // Cargar componentes HTML
  loadComponents();

  // Cargar estilos CSS
  loadStyles(isAutomatic);

  // Configurar el botón de generación automática
  setupButtonStartAutomatic();

  // Si se ha activado la generación automática, iniciar el controlador automático
  if (isAutomatic) {
    await automaticController();
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
  const MultiSelectTagScript = `
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
      input.placeholder = "Buscar...";

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
        ${`<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 21 6 15"></polyline></svg>`},
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
        ${`<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="item-close-svg">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>`},
        "image/svg+xml"
      ).documentElement;

      itemClose.addEventListener("click", (e) => {
        const unselectOption = options.find((op) => op.value == option.value);
        unselectOption.selected = false;
        removeTag(option.value);
        initOptions();
        setValues();
      });

      itemDiv.appendChild(itemLabel);
      itemDiv.appendChild(itemClose);
      inputContainer.append(itemDiv);
    }

    function enableItemSelection() {
      // Add click listener to the list items
      for (var li of ul.children) {
        li.addEventListener("click", (e) => {
          options.find(
            (o) => o.value == e.target.dataset.value
          ).selected = true;
          input.value = null;
          initOptions();
          setValues();
          //console.log('KKKKKKs');
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
  }`;

  const html =
    // Contenido HTML
    `<div id="container">
    <div id="panel-container">
      <div id="initial-container">
        <h3 class="panel-title">Crea tu horario</h3>
        <div class="buttons-container">
          <button class="button" id="button-start-automatic">Generar automáticamente</button>
          <button class="button" id="button-start-manual">Seleccionar manualmente</button>
        </div>
      </div>

      <div id="automatic-container">
        <h3 class="panel-title">Generar horario</h3>
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
        <button class="button" id="button-generate-automatic">Generar horario</button>
      </div>
    </div>
  </div>`;

  // Insertar el HTML a la página
  const containerElement = document.querySelector(".container");

  if (containerElement) {
    containerElement.insertAdjacentHTML("beforeend", html);
  }
}

function loadStyles(isAutomatic) {
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
      background: #b90b05;
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
    #container {
      margin: 50px 0 30px;
      display: block;
      font-family: Arial, sans-serif;
      color: black;
    }

    #panel-container {
      background: white;
      padding: 17px 21px;
      border-radius: 21px;
      box-shadow: 0 0 19px rgba(0, 0, 0, 0.2);
    }

    #initial-container {
      display: flex;
      flex-direction: column;
      gap: 10px;

      ${isAutomatic ? "display: none;" : ""}
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
      background-color: #b90b05;
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

function getComponents() {
  return {
    panelContainer: document.getElementById("panel-container"),
    panelTitle: document.getElementById("panel-title"),
    initialContainer: document.getElementById("initial-container"),
    buttonStartAutomatic: document.getElementById("button-start-automatic"),
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
  };
}

function getSAESelements() {
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
    SAEShorariosTable: document.getElementById("ctl00_mainCopy_dbgHorarios"),
  };
}

function startAutomatic(event) {
  event.preventDefault();

  // Bandera para indicar que se ha iniciado el proceso de generación automática
  chrome.storage.local.set({ isAutomatic: true });

  // Recargar la página para aplicar los cambios
  window.location.reload();
}

async function automaticController() {
  // Obtener elementos del SAES
  const { SAEScarreraSelect, SAESplanSelect } = getSAESelements();

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
  const { SAEScarreraSelect } = getSAESelements();

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
    chrome.storage.local.remove("clases");

    // Limpiar las asignaturas escaneadas
    chrome.storage.local.remove("dataAsignaturas");
    chrome.storage.local.remove("selectedAsignaturas");

    // Limpiar los turnos y periodos pendientes
    chrome.storage.local.remove("pendingTurnos");
    chrome.storage.local.remove("pendingPeriodos");

    // Seleccionar la carrera en el SAES
    changeSelectorValue(SAEScarreraSelect, selectedCarrera); // Esto recarga la página
  });
}

async function setupPlanSelect(planes, defaultPlan) {
  const { planLabel, planSelect } = getComponents();
  const { SAESplanSelect } = getSAESelements();

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
    chrome.storage.local.remove("clases");

    // Limpiar los turnos y periodos pendientes
    chrome.storage.local.remove("pendingTurnos");
    chrome.storage.local.remove("pendingPeriodos");

    // Seleccionar la carrera en el SAES
    changeSelectorValue(SAESplanSelect, selectedPlan); // Esto recarga la página
  });
}

async function clasesScanner() {
  const { SAESturnoSelect, SAESperiodoSelect, SAEShorariosTable } =
    getSAESelements();

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
    chrome.storage.local.set({ selectedAsignaturas: selectedOptions });
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
        //console.log('KKKKKKs');
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
  const { buttonGenerateAutomatic, asignaturasSelect } = getComponents();

  buttonGenerateAutomatic.addEventListener("click", async (event) => {
    // Evitar que se recargue la página
    event.preventDefault();

    // Obtener las asignaturas seleccionados
    const selectedAsignaturas = Array.from(
      asignaturasSelect.selectedOptions
    ).map((option) => option.value);

    // Generar los horarios
    await generateHorarios(selectedAsignaturas);
  });
}

async function generateHorarios(selectedAsignaturas) {
  // Obtener las clases escaneadas
  const clases =
    (await chrome.storage.local.get("dataClases")).dataClases || [];

  // Obtener solo las clases que coinciden con las asignaturas seleccionadas
  const filteredClases = filtrarClases(clases, selectedAsignaturas);

  // Generar horarios con todas las combinaciones de clases posibles
  const horarios = getHorarios(filteredClases);

  // Eliminar horarios con traslapes
  const horariosFiltrados = removeTraslapes(horarios);

  // Ordenar los horarios de menor a mayor cantidad de horas libres
  const horariosOrdenados = orderByHorasLibres(horariosFiltrados);

  console.log(horariosOrdenados);
}

function filtrarClases(clases, asignaturas) {
  // Arreglo para almacenar los arreglos de clases de cada asignatura
  let filteredClases = [];

  // Se recorre cada asignatura seleccionada
  for (const asignatura of asignaturas) {
    // Cada arreglo dentro de filteredClases representa a una asignatura
    filteredClases.push([]);

    // Se recorre cada clase y se verifica si la asignatura coincide con la asignatura actual
    for (const clase of clases) {
      if (clase.asignatura == asignatura) {
        // Se agrega la clase al arreglo de la asignatura actual
        filteredClases[filteredClases.length - 1].push(clase);
      }
    }
  }

  return filteredClases;
}

function getHorarios(clasesFiltradas) {
  let horarios = [];

  function generateCombinations(clasesArray, currentIndex) {
    // Verificar si la asignatura actual tiene clases
    if (clasesFiltradas[currentIndex].length > 0) {
      // Recorrer todas las clases de la asignatura actual
      for (var j = 0; j < clasesFiltradas[currentIndex].length; j++) {
        // Clonar el array de clases para esta combinación
        var newArray = clasesArray.slice(0);
        // Agregar la clase actual al array de clases de esta combinación
        newArray.push(clasesFiltradas[currentIndex][j]);
        // Verificar si hemos llegado al final de las asignaturas
        if (currentIndex === clasesFiltradas.length - 1) {
          // Si es así, agregar esta combinación a los horarios
          horarios.push(newArray);
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

function removeTraslapes(horarios) {
  let horariosFiltrados = [];

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

  // Iterar sobre los horarios
  for (let i = 0; i < horarios.length; i++) {
    const horario = horarios[i];
    let tieneTraslapes = false;

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
            tieneTraslapes = true;

            break;
          }
        }
        if (tieneTraslapes) break;
      }
      if (tieneTraslapes) break;
    }

    // Si no hay traslapes, agregar el horario a los filtrados
    if (!tieneTraslapes) {
      horariosFiltrados.push(horario);
    }
  }

  return horariosFiltrados;
}

function orderByHorasLibres(horarios) {
  // Función para convertir una hora en formato "HH:MM" a minutos
  function convertirAMinutos(hora) {
    const [horas, minutos] = hora.split(":").map(Number);
    return horas * 60 + minutos;
  }

  // Función para convertir minutos a horas decimales
  function convertirAHorasDecimales(minutos) {
    return minutos / 60;
  }

  // Procesar cada horario
  for (let i = 0; i < horarios.length; i++) {
    const horario = horarios[i];

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

    // Asignar las horas libres al horario
    horarios[i] = {
      clases: horario,
      horasLibres: totalHorasLibres,
    };
  }

  // Ordenar los horarios por horas libres (de menor a mayor)
  return horarios.sort((a, b) => a.horasLibres - b.horasLibres);
}
