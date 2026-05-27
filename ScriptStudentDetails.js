let backendData = {};
let syllabusBackendData = {};

const sessionSelect = document.getElementById("sessionSelect");
const examSessionSelect = document.getElementById("examSessionSelect");

const tableBody = document.getElementById("attendanceTableBody");
const examTableBody = document.getElementById("examSyllabusTableBody");
const overallAttendance = document.getElementById("overallAttendance");

const summaryGrid = document.querySelector(".summary-grid");

sessionSelect.addEventListener("change", loadAttendance);
examSessionSelect.addEventListener("change", loadSyllabus);

async function openTimeTableWindow() {
  const outputData = await CALL_API(API_TYPE_CONSTANT.GET_CLASS_TIMETABLE, {
    studentName: selectedStudent.studentName,
  });
  if (outputData?.status && outputData.data) {
    if (
      typeof outputData.data === "string" &&
      outputData.data.includes("ERR")
    ) {
      SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
      return;
    }

    if (Object.keys(outputData.data.output).length == 0) {
      SHOW_INFO_POPUP("No classes scheduled for you!");
      return;
    }

    openVerifyDetailsWindow(
      outputData.data.header,
      [`Timetable for: ${outputData.data.className}`],
      outputData.data.output,
      backToUserMenu,
      "",
      "",
      ["Ok"],
    );
  } else {
    SHOW_ERROR_POPUP("Unable to fetch the timetable!!");
    return;
  }
}

async function openDateSheetWindow() {
  const outputData = await CALL_API(API_TYPE_CONSTANT.GET_DATESHEET, {
    studentName: selectedStudent.studentName,
  });
  if (outputData?.status && outputData.data) {
    if (typeof outputData.data === "string") {
      if (outputData.data.includes("ERR"))
        SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
      else SHOW_INFO_POPUP(outputData.data);
      return;
    }

    if (Object.keys(outputData.data.output).length == 0) {
      SHOW_INFO_POPUP("No exams scheduled for you!");
      return;
    }

    console.log(outputData.data);

    openVerifyDetailsWindow(
      outputData.data.header,
      [`Datesheet for: ${outputData.data.examName}`],
      outputData.data.output,
      backToUserMenu,
      "",
      "",
      ["Ok"],
    );
  } else {
    SHOW_ERROR_POPUP("Unable to fetch the datesheet!!");
    return;
  }
}

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

async function openAttendanceDashboard() {
  sessionSelect.value = "";
  overallAttendance.innerText = "0%";
  const tableCard = document
    .getElementById("showAttendanceReport")
    .querySelector(".table-card");

  // CLEAR TABLE
  tableBody.innerHTML = "";

  summaryGrid.style.display = "none";
  tableCard.style.display = "none";

  const outputData = await CALL_API(API_TYPE_CONSTANT.GET_STUDENT_ATTENDANCE, {
    studentName: selectedStudent.studentName,
  });

  if (outputData?.status && outputData.data) {
    if (typeof outputData.data === "string") {
      if (outputData.data.includes("ERR")) {
        SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
      } else SHOW_INFO_POPUP(outputData.data);

      return;
    }

    if (Object.keys(outputData.data.output).length == 0) {
      SHOW_INFO_POPUP("No attendance details found!");
      return;
    }

    backendData = outputData.data.output;
    // SHOW CONTAINER
    SHOW_SPECIFIC_DIV("showAttendanceReport");
  } else {
    SHOW_ERROR_POPUP("Unable to fetch the attendance!!");
  }
}

async function openSyllabusDashboard() {
  examSessionSelect.value = "";
  const tableCard = document
    .getElementById("showExamSyllabus")
    .querySelector(".table-card");

  // CLEAR TABLE
  examTableBody.innerHTML = "";

  tableCard.style.display = "none";

  const outputData = await CALL_API("GET_EXAM_SYLLABUS", {
    studentClass: selectedStudent.stdClass,
  });

  if (outputData?.status && outputData.data) {
    if (typeof outputData.data === "string") {
      if (outputData.data.includes("ERR")) {
        SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
      } else SHOW_INFO_POPUP(outputData.data);

      return;
    }

    if (Object.keys(outputData.data.output).length == 0) {
      SHOW_INFO_POPUP("No syllabus found!");
      return;
    }

    syllabusBackendData = outputData.data.output;
    // SHOW CONTAINER
    SHOW_SPECIFIC_DIV("showExamSyllabus");
  } else {
    SHOW_ERROR_POPUP("Unable to fetch the syllabus!!");
  }
}

async function openComputerExamWindow() {
  let i, j;
  let now = new Date();

  const outputData = await CALL_API("GET_COMPUTER_EXAMS", {
    studentName: selectedStudent.studentName,
    studentClass: selectedStudent.stdClass,
  });

  if (typeof outputData?.data === "string") {
    if (outputData.data.includes("ERR")) {
      SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
    } else SHOW_INFO_POPUP(outputData.data);
    return;
  }

  if (outputData && Object.keys(outputData.data.output).length == 0) {
    SHOW_INFO_POPUP("No Computer Exam Found for today!");
    return;
  }

  if (!outputData) {
    SHOW_ERROR_POPUP("Problem in fetching Computer Exams!");
    return;
  }

  let apiOutput = outputData.data.output;

  console.log(apiOutput);

  const [start, end] = apiOutput.time_slot.split(" - ");

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startMinutes = timeToMinutes(start) - 2;
  const endMinutes = timeToMinutes(end) + 10;

  if (currentMinutes < startMinutes) {
    console.log(
      `Current time slot is not within the exam time range: ${apiOutput.time_slot}`,
    );
    SHOW_ERROR_POPUP(
      "❌ Action Disallowed ❌\n\n⚠️Examination has NOT STARTED!",
    );
    return;
  } else if (currentMinutes > endMinutes) {
    console.log(
      `Current time slot is not within the exam time range: ${apiOutput.time_slot}`,
    );
    SHOW_ERROR_POPUP("❌ Action Disallowed ❌\n\n⚠️Examination IS OVER!");
    return;
  }

  document.getElementById("computerExamHeading").innerHTML =
    `Details for ${apiOutput.exam_name}`;

  document.getElementById("viewQPBtn").onclick = function () {
    window.open(apiOutput.question_paper, "_blank");
  };

  document.getElementById("openWorkBtn").onclick = function () {
    window.open(apiOutput.work_area, "_blank");
  };

  document.getElementById("showLoginBtn").onclick = function () {
    SHOW_INFO_POPUP(
      `Id: ${apiOutput.login_id}\n\nPassword: ${apiOutput.login_pw}`,
    );
  };

  // Show the parent popup
  SHOW_SPECIFIC_DIV("computerExamWindow");
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

function loadAttendance() {
  const selectedSession = sessionSelect.value;
  const tableCard = document
    .getElementById("showAttendanceReport")
    .querySelector(".table-card");
  overallAttendance.innerText = "0%";
  tableBody.innerHTML = "";

  console.log(selectedSession);

  if (selectedSession === "") {
    summaryGrid.style.display = "none";

    tableCard.style.display = "none";

    return;
  }

  summaryGrid.style.display = "block";

  tableCard.style.display = "block";

  let subjectMap = {};

  processSessionData(backendData[selectedSession] || "", subjectMap);

  const subjectsArray = Object.entries(subjectMap).map(([subject, values]) => ({
    subject,
    present: values.present,
    total: values.total,
    percentage: ((values.present / values.total) * 100).toFixed(2),
  }));

  renderSummary(subjectsArray);
  renderTable(subjectsArray);
}

function loadSyllabus() {
  const selectedSession = examSessionSelect.value;
  const tableCard = document
    .getElementById("showExamSyllabus")
    .querySelector(".table-card");

  examTableBody.innerHTML = "";

  console.log(selectedSession);

  if (selectedSession === "") {
    tableCard.style.display = "none";

    return;
  }

  tableCard.style.display = "block";

  console.log(syllabusBackendData[selectedSession]);

  renderExamTable(syllabusBackendData[selectedSession]);
}

function processSessionData(text, subjectMap) {
  const lines = text.split("\n");

  lines.forEach((line) => {
    const match = line.match(/(.+) - (\d+)\/(\d+)/);

    if (!match) return;

    const subject = match[1].trim();

    const present = Number(match[2]);
    const total = Number(match[3]);

    if (!subjectMap[subject]) {
      subjectMap[subject] = {
        present: 0,
        total: 0,
      };
    }

    subjectMap[subject].present += present;
    subjectMap[subject].total += total;
  });
}

function renderSummary(data) {
  if (data.length === 0) {
    return;
  }

  let totalPresent = 0;
  let totalClasses = 0;

  data.forEach((item) => {
    totalPresent += item.present;
    totalClasses += item.total;
  });

  const overall = ((totalPresent / totalClasses) * 100).toFixed(2);

  overallAttendance.innerText = overall + "%";
}

function renderTable(data) {
  tableBody.innerHTML = "";

  data.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `

          <td>${item.subject}</td>

          <td>${item.present}</td>

          <td>${item.total}</td>

          <td>${item.percentage}%</td>

        `;

    tableBody.appendChild(row);
  });
}

function renderExamTable(data) {
  examTableBody.innerHTML = "";
  let i;

  for (i in data) {
    const row = document.createElement("tr");

    row.innerHTML = `

          <td>${i}</td>

          <td>${data[i]}</td>

        `;

    examTableBody.appendChild(row);
  }
}
