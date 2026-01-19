window.addEventListener("load", async () => {
  // Visualizar información
  const {
    SAESform,
    SAESperiodoActualCheck,
    SAESperiodoAnteriorCheck,
    SAEScarreraSelect,
    SAESplanSelect,
  } = getSAEScomponents();
  if (!SAESperiodoActualCheck.checked && !SAESperiodoAnteriorCheck.checked) {
    // Bandera para indicar que no se ha seleccionado la carrera por defecto en la primera carga
    chrome.storage.local.set({
      isPendingCarrera: true,
    });

    // Bandera para indicar que no se ha seleccionado el plan de estudios por defecto en la primera carga
    chrome.storage.local.set({
      isPendingPlan: true,
    });

    SAESperiodoActualCheck.checked = "checked";
    SAESform.submit();

    return; // No continuar con la carga de horarios
  }

  // Seleccionar la carrera y plan de estudios previamente guardados
  const selectedCarrera = (await chrome.storage.local.get("selectedCarrera"))
    .selectedCarrera;
  const selectedPlan = (await chrome.storage.local.get("selectedPlan"))
    .selectedPlan;

  if (
    selectedCarrera &&
    (await chrome.storage.local.get("isPendingCarrera")).isPendingCarrera
  ) {
    chrome.storage.local.remove("isPendingCarrera"); // Limpiar la bandera
    changeSelectorValue(SAEScarreraSelect, selectedCarrera);
    return;
  }

  if (
    selectedPlan &&
    (await chrome.storage.local.get("isPendingPlan")).isPendingPlan
  ) {
    chrome.storage.local.remove("isPendingPlan"); // Limpiar la bandera
    changeSelectorValue(SAESplanSelect, selectedPlan);
    return;
  }

  // Obtener horarios guardados por el usuario
  const horariosGuardados =
    (await chrome.storage.local.get("userHorariosGuardados"))
      .userHorariosGuardados || [];

  const hasHorariosGuardados = horariosGuardados.length > 0;

  // Mostrar el contenedor de horarios guardados si hay horarios guardados
  if (hasHorariosGuardados) {
    // Escanear cupos de los horarios guardados
    scanHorariosCupos(horariosGuardados);

    // Cargar los componentes HTML
    loadComponents();

    // Cargar los estilos CSS
    loadStyles();

    // Configurar el contenedor de horarios guardados
    setupContainerHorariosGuardados(horariosGuardados);
  }
});

function getSAEScomponents() {
  return {
    SAESform: document.getElementById("aspnetForm"),
    SAESperiodoActualCheck: document.getElementById(
      "ctl00_mainCopy_rblEsquema_0"
    ),
    SAESperiodoAnteriorCheck: document.getElementById(
      "ctl00_mainCopy_rblEsquema_1"
    ),
    SAEScarreraSelect: document.getElementById("ctl00_mainCopy_dpdcarrera"),
    SAESplanSelect: document.getElementById("ctl00_mainCopy_dpdplan"),
    SAESocupabilidadTable:
      document.getElementById("ctl00_mainCopy_GrvOcupabilidad") ||
      document.getElementById("regs"), // Compatibilidad con MODS SAES anterior
  };
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

function scanHorariosCupos(horarios) {
  horarios.forEach((horario) => {
    const { SAESocupabilidadTable } = getSAEScomponents();

    // Si la tabla de ocupabilidad existe, escanear los cupos
    if (SAESocupabilidadTable) {
      let rows = SAESocupabilidadTable.querySelectorAll("tbody tr");
      rows = Array.from(rows).slice(1);

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");

        const grupo = cells[0].textContent.trim();
        const asignatura = cells[2].textContent.trim();
        const cupo = cells[6].textContent.trim();
        horario.clases.forEach((clase) => {
          if (clase.grupo === grupo && clase.asignatura === asignatura) {
            clase.cupo = cupo;
          }
        });
      });
    }
  });

  // Guardar los horarios actualizados en el almacenamiento local
  chrome.storage.local.set({ userHorariosGuardados: horarios });
}

function loadComponents() {
  const html =
    // Contenido HTML
    `<div class="reprobados-container" id="guardados-container">
        <div class="panel-container">
          <h3 class="panel-title">Tus horarios guardados</h3>
          <div class="horarios-container">
            <div id="horarios-slider-guardados" class="horarios-slider"></div>
          </div>
        </div>
    </div>
  </div>`;

  // Insertar el HTML a la página
  const containerElement =
    document.querySelector('[style="width: 632px; background-color: white"]') ||
    document.querySelector('[style="background-color: #FFF; width: 100%;"]'); // Compatibilidad con MODS SAES anterior

  if (containerElement) {
    containerElement.insertAdjacentHTML("afterbegin", html);
  }
}

function loadStyles() {
  const styles =
    // Hoja de estilos CSS
    `
    .reprobados-container {
      margin: 20px;
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

    .panel-title {
      margin: 0;
      font-size: 19px;
      font-weight: bold;
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

    #guardados-container {
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
  `;

  // Crear un elemento de estilo
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  // Insertar el elemento de estilo en el head del documento
  document.head.appendChild(styleElement);
}

function setupContainerHorariosGuardados(horarios) {
  // Obtener el contenedor de horarios guardados
  const horariosGuardadosSlider = document.getElementById(
    "horarios-slider-guardados"
  );

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
        <th>Cupos</th>
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
      row.style.color = clase.cupo <= 0 ? "#D90452" : ""; // Cambiar el color de la fila si el cupo es 0

      row.innerHTML = `
        <td>${clase.grupo}</td>
        <td>${clase.asignatura}</td>
        <td>${clase.profesor}</td>
        <td>${clase.horas.lunes || ""}</td>
        <td>${clase.horas.martes || ""}</td>
        <td>${clase.horas.miercoles || ""}</td>
        <td>${clase.horas.jueves || ""}</td>
        <td>${clase.horas.viernes || ""}</td>
        <td>${clase.cupo || ""}</td>
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
