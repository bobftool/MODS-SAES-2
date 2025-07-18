window.addEventListener("load", async () => {
  // Visualizar información
  const { SAESform, SAESvisualizarButton } = getSAESelements();
  if (SAESvisualizarButton) SAESform.submit();

  // Cargar el panel de generación de horarios
  loadPanel();

  // Cargar banderas de control
  loadFlags();

  // Obtener los elementos del panel
  const { automaticContainer, buttonStartAutomatic } = getPanelElements();

  // Opciones iniciales
  automaticContainer.hidden = true; // Oculto por defecto
  buttonStartAutomatic.addEventListener("click", (event) => {
    startAutomatic(event);
  });

  // Obtener bandera de generación automática
  const isAutomatic = (await chrome.storage.local.get("isAutomatic"))
    .isAutomatic;

  if (isAutomatic) {
    await automaticController();
  }
});

function loadPanel() {
  // Generar el contenedor del panel
  const panelContainer = document.createElement("div");
  panelContainer.id = "panel-container";
  // ------------------------------------

  // Titulo del pnael
  const panelTitle = document.createElement("h3");
  panelTitle.id = "panel-title";
  panelTitle.textContent = "Crea tu horario";
  panelContainer.appendChild(panelTitle);
  // ------------------------------------

  // Opciones iniciales
  const initialContainer = document.createElement("div");
  initialContainer.id = "initial-container";
  panelContainer.appendChild(initialContainer);

  const buttonStartAutomatic = document.createElement("button");
  buttonStartAutomatic.id = "button-start-automatic";
  buttonStartAutomatic.textContent = "Generar automáticamente";
  initialContainer.appendChild(buttonStartAutomatic);
  // -------------------------------------------------

  // Controles para generar horarios automáticamente
  // Generar el contenedor de generación automática
  const automaticContainer = document.createElement("div");
  automaticContainer.id = "automatic-container";
  panelContainer.appendChild(automaticContainer);

  const automaticForm = document.createElement("form");
  automaticForm.id = "automatic-form";
  automaticContainer.appendChild(automaticForm);

  const carreraLabel = document.createElement("label");
  carreraLabel.textContent = "Carrera:";
  automaticForm.appendChild(carreraLabel);

  const carreraSelect = document.createElement("select");
  carreraSelect.id = "carrera-select";
  carreraSelect.multiple = false; // Solo una carrera a la vez
  automaticForm.appendChild(carreraSelect);

  const planLabel = document.createElement("label");
  planLabel.id = "plan-label";
  planLabel.textContent = "Plan de estudio:";
  automaticForm.appendChild(planLabel);

  const planSelect = document.createElement("select");
  planSelect.id = "plan-select";
  planSelect.multiple = false; // Solo un plan a la vez
  automaticForm.appendChild(planSelect);

  const asignaturasLabel = document.createElement("label");
  asignaturasLabel.id = "asignaturas-label";
  asignaturasLabel.textContent = "Asignaturas:";
  automaticForm.appendChild(asignaturasLabel);

  const asignaturasSelect = document.createElement("select");
  asignaturasSelect.id = "asignaturas-select";
  asignaturasSelect.multiple = true; // Seleccionar múltiples asignaturas
  automaticForm.appendChild(asignaturasSelect);

  const submitButton = document.createElement("button");
  submitButton.id = "submit-button";
  submitButton.textContent = "Generar horario";
  submitButton.type = "submit"; // Enviar el formulario
  automaticForm.appendChild(submitButton);
  // ---------------------------------------

  // Insertar el contenedor del panel en el DOM
  const containerElement = document.querySelector(".container");
  if (containerElement) containerElement.appendChild(panelContainer);
  // ----------------------------------------------------------------
}

function loadFlags() {
  // Generación automática
  chrome.storage.local.get("isAutomatic", (result) => {
    if (result.isAutomatic == undefined)
      chrome.storage.local.set({ isAutomatic: false });
  });
  // Escaneo de clases
  chrome.storage.local.get("isScanning", (result) => {
    if (result.isScanning == undefined)
      chrome.storage.local.set({ isScanning: false });
  });
}

function getPanelElements() {
  return {
    panelContainer: document.getElementById("panel-container"),
    panelTitle: document.getElementById("panel-title"),
    initialContainer: document.getElementById("initial-container"),
    buttonStartAutomatic: document.getElementById("button-start-automatic"),
    automaticContainer: document.getElementById("automatic-container"),
    automaticForm: document.getElementById("automatic-form"),
    carreraLabel: document.getElementById("carrera-label"),
    carreraSelect: document.getElementById("carrera-select"),
    planLabel: document.getElementById("plan-label"),
    planSelect: document.getElementById("plan-select"),
    asignaturasLabel: document.getElementById("asignaturas-label"),
    asignaturasSelect: document.getElementById("asignaturas-select"),
    submitButton: document.getElementById("submit-button"),
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
  // Evitar que se recargue la página
  event.preventDefault();

  // Bandera para indicar que se ha iniciado el proceso de generación automática
  chrome.storage.local.set({ isAutomatic: true });

  // Recargar la página para aplicar los cambios
  window.location.reload();
}

async function automaticController() {
  // Obtener elementos del panel
  const {
    initialContainer,
    automaticContainer,
    planLabel,
    planSelect,
    asignaturasLabel,
    asignaturasSelect,
    submitButton,
  } = getPanelElements();

  // Obtener elementos del SAES
  const { SAEScarreraSelect, SAESplanSelect } = getSAESelements();

  // Mostrar el contenedor de generación automática y ocultar las opciones iniciales
  automaticContainer.hidden = false;
  initialContainer.hidden = true;

  // Ocultar el label y selector de plan de estudio si aún no se ha seleccionado una carrera
  planLabel.hidden = true;
  planSelect.hidden = true;

  // Ocultar el label y selector de asignaturas si aún no se ha seleccionado un plan de estudio
  asignaturasLabel.hidden = true;
  asignaturasSelect.hidden = true;

  // Ocultar el botón de generar horario
  submitButton.hidden = true;

  // Obtener las carreras disponibles y guardarlas en el almacenamiento local
  const carreras = getSelectorOptions(SAEScarreraSelect);
  chrome.storage.local.set({ carreras });

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
    chrome.storage.local.set({ planes });

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
        setupAutomaticForm();

        // Mostrar botón de generar horario
        submitButton.hidden = false;
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
  const { carreraSelect } = getPanelElements();
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
  const { planLabel, planSelect } = getPanelElements();
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
  let clases = (await chrome.storage.local.get("clases")).clases || [];

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
  chrome.storage.local.set({ clases });

  // Actualizar asignaturas escaneadas
  chrome.storage.local.set({ dataAsignaturas: asignaturas });
}

function setupAsignaturasSelect(asignaturas, selectedAsignaturas) {
  const { asignaturasLabel, asignaturasSelect } = getPanelElements();

  // Mostrar el label y selector de asignaturas
  asignaturasLabel.hidden = false;
  asignaturasSelect.hidden = false;

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
}

function setupAutomaticForm() {
  const { automaticForm, asignaturasSelect } = getPanelElements();

  automaticForm.addEventListener("submit", async (event) => {
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
  const clases = (await chrome.storage.local.get("clases")).clases || [];

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

// ---
/*
function getPlanEstudios(carrera) {
  let carrerasSelect = document.getElementById(
    "ctl00_mainCopy_Filtro_cboCarrera"
  );
  Array.from(carrerasSelect.options).forEach((option) => {
    if (option.value === carrera) {
      option.selected = "selected"; // Seleccionar la carrera
      carrerasSelect.dispatchEvent(new Event("change")); // Disparar el evento de cambio para actualizar los planes de estudio
    }
  });
}
*/

/*
async function getData() {
  let data = {
    horarios: [],
    carreras: [],
    planes: [],
    asignaturas: [],
    profesores: [],
    lastUpdate: new Date().toISOString(),
  };

  // Obtener el formulario de filtros
  let form = document.getElementById("aspnetForm");

  // Obtener las carreras disponibles
  let carreras = document
    .getElementById("ctl00_mainCopy_Filtro_cboCarrera")
    .getElementsByTagName("option");

  // Escanear las carreras
  console.log("Escaneando carreras...");
  console.log(carreras.length, "carreras encontradas");
  for (let i = 0, n = carreras.length; i < n; i++) {
    carreras[i].selected = "selected"; // Se simula un click en cada carrera
    await form.submit(); // Se envía el formulario para cargar los datos de la carrera actual
    const start = Date.now();
    while (Date.now() - start < 2000);

    // Se guardan las carreras en un array separado y en los horarios solo se almacena el índice para ahorrar espacio
    data.carreras.push(carreras[i].textContent);
    carreraIndex = data.carreras.length - 1;

    // Obtener los planes de estudio para la carrera actual
    let planes = document
      .getElementById("ctl00_mainCopy_Filtro_cboPlanEstud")
      .getElementsByTagName("option");

    // Escanear los planes de estudio
    console.log("Escaneando planes de estudio...");
    console.log(planes.length, "planes encontrados");
    for (let j = 0, w = planes.length; j < w; j++) {
      planes[j].selected = "selected"; // Se simula un click en cada plan
      form.submit(); // Se envía el formulario para cargar los datos del plan actual

      // Los planes estan vinculados a una carrera
      let plan = {
        nombre: planes[j].textContent.trim(),
        carrera: carreraIndex,
      };
      // Se guardan los planes en un array separado y en los horarios solo se almacena el índice para ahorrar espacio
      data.planes.push(plan);
      planIndex = data.planes.length - 1;

      // Obtener los turnos disponibles para la carrera actual
      let turnos = document
        .getElementById("ctl00_mainCopy_Filtro_cboTurno")
        .getElementsByTagName("option");

      // Escanear los turnos
      console.log("Escaneando turnos...");
      console.log(turnos.length, "turnos encontrados");
      for (let k = 0, o = turnos.length; k < o; k++) {
        turnos[k].selected = "selected"; // Se simula un click en cada turno
        form.submit(); // Se envía el formulario para cargar los datos del turno actual

        // Obtener los periodos disponibles para la carrera actual
        let periodos = document
          .getElementById("ctl00_mainCopy_Filtro_lsNoPeriodos")
          .getElementsByTagName("option");

        // Escanear los periodos
        console.log("Escaneando periodos...");
        console.log(periodos.length, "periodos encontrados");
        for (let l = 0, p = periodos.length; l < p; l++) {
          periodos[l].selected = "selected"; // Se simula un click en cada periodo
          form.submit(); // Se envía el formulario para cargar los datos del periodo actual

          //Obtener la tabla de horarios
          let horariosTable = document.getElementById(
            "ctl00_mainCopy_dbgHorarios"
          );

          if (!horariosTable) continue; // Si no hay tabla de horarios, continuar con el siguiente periodo

          // Obtener las filas de la tabla de horarios
          let horariosRows = horariosTable
            .getElementsByTagName("tbody")[0]
            .getElementsByTagName("tr");

          // Escanear las filas de la tabla de horarios
          console.log("Escaneando filas de horarios...");
          console.log(horariosRows.length, "filas encontradas");
          console.log("Carrera:", carreras[i].textContent.trim());
          console.log("Plan:", plan.nombre);
          console.log("Turno:", turnos[k].textContent.trim());
          console.log("Periodo:", periodos[l].textContent.trim());

          for (let m = 1, q = horariosRows.length; m < q; m++) {
            // Obtener las columnas de la fila actual
            let rowColumns = horariosRows[m].getElementsByTagName("td");

            // Extraer los datos de la fila actual
            let grupo = rowColumns[0].textContent.trim();
            // Las asignaturas estan vinculadas a una carrera y a un plan de estudio
            let asignatura = {
              nombre: rowColumns[1].textContent.trim(),
              carrera: carreraIndex,
              plan: planIndex,
            };
            let profesor = rowColumns[2].textContent.trim();
            let horas = {
              lunes: rowColumns[5].textContent.trim(),
              martes: rowColumns[6].textContent.trim(),
              miercoles: rowColumns[7].textContent.trim(),
              jueves: rowColumns[8].textContent.trim(),
              viernes: rowColumns[9].textContent.trim(),
            };

            // Se guardan las asignaturas en un array separado y en los horarios solo se almacena el índice para ahorrar espacio
            // Buscar si la asignatura ya existe en el array de asignaturas
            let asignaturaIndex = data.asignaturas.findIndex(
              (a) =>
                a.nombre === asignatura.nombre &&
                a.carrera === asignatura.carrera &&
                a.plan === asignatura.plan
            );
            // Si no existe, se agrega al array de asignaturas
            if (asignaturaIndex == -1) {
              data.asignaturas.push(asignatura);
              asignaturaIndex = data.asignaturas.length - 1;
            }

            // Se guardan los profesores en un array separado y en los horarios solo se almacena el índice para ahorrar espacio
            // Buscar si el profesor ya existe en el array de profesores
            let profesorIndex = data.profesores.indexOf(profesor);
            // Si no existe, se agrega al array de profesores
            if (profesorIndex == -1) {
              data.profesores.push(profesor);
              profesorIndex = data.profesores.length - 1;
            }

            let clase = {
              grupo,
              asignatura: asignaturaIndex,
              profesor: profesorIndex,
              horas,
            };

            data.horarios.push(clase);
          }
        }
      }
    }

    //-----------------------------------------------------------------
    }

  return data;
}
*/

/*
function generateHorarios() {
  chrome.storage.local.get("horarios", ({ horarios }) => {
    if (horarios && horarios.length > 0) {
      const asignaturas = [
        ...new Set(
          horarios.map((h) => {
            return { nombre: h.asignatura, carrera: h.carrera };
          })
        ),
      ];
      const profesores = [...new Set(horarios.map((h) => h.profesor))];
      const carreras = [...new Set(asignaturas.map((a) => a.carrera))];

      const form = document.createElement("form");

      const carreraLabel = document.createElement("label");
      carreraLabel.textContent = "Carrera:";
      const carreraSelect = document.createElement("select");
      carreraSelect.multiple = false;

      carreras.forEach((carrera) => {
        const option = document.createElement("option");
        option.value = carrera;
        option.textContent = carrera;
        carreraSelect.appendChild(option);
      });

      const asignaturaLabel = document.createElement("label");
      asignaturaLabel.textContent = "Asignaturas:";
      const asignaturaSelect = document.createElement("select");
      asignaturaSelect.multiple = true;
      asignaturas.forEach((asignatura) => {
        const option = document.createElement("option");
        option.value = asignatura.nombre;
        option.textContent = asignatura.nombre;
        option.dataset.carrera = asignatura.carrera;
        asignaturaSelect.appendChild(option);
      });

      carreraSelect.addEventListener("change", () => {
        const selectedCarrera = carreraSelect.value;
        Array.from(asignaturaSelect.options).forEach((option) => {
          option.style.display =
            option.dataset.carrera === selectedCarrera || !selectedCarrera
              ? "block"
              : "none";
        });
      });

      const profesorLabel = document.createElement("label");
      profesorLabel.textContent = "Profesores:";
      const profesorSelect = document.createElement("select");
      profesorSelect.multiple = true;
      profesores.forEach((profesor) => {
        const option = document.createElement("option");
        option.value = profesor;
        option.textContent = profesor;
        profesorSelect.appendChild(option);
      });

      const submitButton = document.createElement("button");
      submitButton.type = "submit";
      submitButton.textContent = "Filtrar";

      form.appendChild(carreraLabel);
      form.appendChild(carreraSelect);
      form.appendChild(asignaturaLabel);
      form.appendChild(asignaturaSelect);
      form.appendChild(profesorLabel);
      form.appendChild(profesorSelect);
      form.appendChild(submitButton);

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const selectedCarrera = carreraSelect.value;
        const selectedAsignaturas = Array.from(
          asignaturaSelect.selectedOptions
        ).map((option) => option.value);
        const selectedProfesores = Array.from(
          profesorSelect.selectedOptions
        ).map((option) => option.value);
        filterHorarios(
          selectedCarrera,
          selectedAsignaturas,
          selectedProfesores
        );
      });

      message.appendChild(form);
    }
  });

  function filterHorarios(carrera, asignaturas, profesores) {
    chrome.storage.local.get("horarios", ({ horarios }) => {
      if (horarios && horarios.length > 0) {
        const filteredHorarios = horarios.filter(
          (horario) =>
            (carrera === "" || horario.carrera === carrera) &&
            (asignaturas.length === 0 ||
              asignaturas.includes(horario.asignatura)) &&
            (profesores.length === 0 || profesores.includes(horario.profesor))
        );
        console.log("Filtered Horarios:", filteredHorarios);
        // You can add further actions with filteredHorarios here
      }
    });
  }
}
*/
