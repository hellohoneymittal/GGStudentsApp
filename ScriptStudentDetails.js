async function openAcademicReportsScreen() {
  let input_map;
  let i, j;

  const outputData = await CALL_API("GET_PTM_REPORTS", {
    studentName: selectedStudent.studentName,
  });

  console.log(outputData.data);

  if (outputData?.status == "success" && outputData.data) {
    if (typeof outputData.data === "string") {
      if (outputData.data.includes("ERR"))
        SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
      else SHOW_INFO_POPUP(outputData.data);

      return;
    }

    input_map = outputData.data;
    createReportAccordion(input_map, "showAcademicReportsWindow");
    SHOW_SPECIFIC_DIV("showAcademicReports");
  } else {
    SHOW_ERROR_POPUP("Internal error!");
    return;
  }
}

function createReportAccordion(input_data, inputId) {
  const mainContainer = document.getElementById(inputId);
  mainContainer.innerHTML = "";
  const examOrder = [
    "Unit Test 1",
    "Unit Test 2",
    "Unit Test 3",
    "Half Yearly Examination",
    "Unit Test 4",
    "Unit Test 5",
    "Unit Test 6",
    "Annual Examination",
  ];

  // LOOP YEARS
  Object.entries(input_data)
    .sort((a, b) => {
      // Extract starting year
      const yearA = parseInt(a[0].split("-")[0]);
      const yearB = parseInt(b[0].split("-")[0]);

      // Descending order
      return yearB - yearA;
    })
    .forEach(([academicYear, exams]) => {
      // ACCORDION ITEM
      const accordionItem = document.createElement("div");
      accordionItem.classList.add("accordion-item");

      // HEADER
      const header = document.createElement("button");
      header.classList.add("accordion-header");

      header.innerHTML = `
      ${academicYear}
      <span class="icon">▶</span>
    `;

      // CONTENT
      const content = document.createElement("div");
      content.classList.add("accordion-content");

      // GRID
      const grid = document.createElement("div");
      grid.classList.add("question-grid");

      // LOOP EXAMS
      Object.entries(exams)
        .sort((a, b) => {
          const indexA = examOrder.indexOf(a[0]);
          const indexB = examOrder.indexOf(b[0]);

          return indexA - indexB;
        })
        .forEach(([examName, fileId]) => {
          const row = document.createElement("div");
          row.classList.add("radio-content-box");

          row.innerHTML = `
            <label>${examName}</label>

            <div class="radio-content-inbox">
              <a href="https://drive.google.com/file/d/${fileId}/preview"
                target="_blank">
                View
              </a>
            </div>

            <div class="radio-content-inbox">
              <a href="https://drive.google.com/uc?export=download&id=${fileId}"
                target="_blank">
                Download
              </a>
            </div>
          </div>
          `;

          grid.appendChild(row);
        });

      // APPEND
      content.appendChild(grid);

      accordionItem.appendChild(header);
      accordionItem.appendChild(content);

      mainContainer.appendChild(accordionItem);

      // TOGGLE
      header.addEventListener("click", () => {
        content.classList.toggle("show");
        header.classList.toggle("active");
      });
    });
}
