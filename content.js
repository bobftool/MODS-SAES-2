window.addEventListener("load", () => {
    /*
  const horarioElement = document.getElementById(
    "ctl00_mainCopy_dbgHorarios"
  );
  if (horarioElement) {
    const horarioText = horarioElement.textContent.trim();
    const horarioArray = horarioText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    const horarioList = document.createElement("ul");
    horarioArray.forEach((horario) => {
      const listItem = document.createElement("li");
      listItem.textContent = horario;
      horarioList.appendChild(listItem);
    });

    const container = document.createElement("div");
    container.appendChild(horarioList);

    document.body.appendChild(container);
  }
    */

  const messageContainer = document.createElement("div");
  messageContainer.appendChild(
    document.createTextNode("MOD SAES 2 By ReprobadosDev")
  );
    messageContainer.style.position = "fixed";
    messageContainer.style.bottom = "10px";
    messageContainer.style.right = "10px";
    messageContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    messageContainer.style.color = "white";
    messageContainer.style.padding = "10px";
    messageContainer.style.borderRadius = "5px";

    const containerElement = document.querySelector(".container");
    if (containerElement) {
        const table = containerElement.querySelector("table");
        if (table) {
            const secondRow = table.rows[1];
            if (secondRow) {
                const cell = secondRow.insertCell(-1);
                cell.appendChild(messageContainer);
            }
        }
    }
});
