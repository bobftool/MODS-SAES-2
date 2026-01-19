window.addEventListener("load", async () => {
  // Visualizar información
  const { SAEStable } = getSAEScomponents();

  console.log(SAEStable);
});

function getSAEScomponents() {
  return {
    SAEStable: document.getElementById("ctl00_mainCopy_GV_Profe"),
  };
}

