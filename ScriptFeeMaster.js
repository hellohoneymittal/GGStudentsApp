const feeScreenshot = document.getElementById("feeScreenshot");
const feePreviewContainer = document.getElementById("feePreviewContainer");
const feePreviewImage = document.getElementById("feePreviewImage");
const feeRemoveImage = document.getElementById("feeRemoveImage");
const feeStudentList = document.getElementById("feeStudentList");
let selectedFile64String = "";
let selectedfile = null;
let selectedFileType = "";
let selectedFileName = "";
let stdFatherName = "";
let students = [];

feeScreenshot.addEventListener("change", function () {
  const file = this.files[0];

  if (!file) {
    selectedfile = null;
    selectedFile64String = "";
    feePreviewContainer.style.display = "none";
    return;
  }

  selectedfile = file;

  const reader = new FileReader();

  reader.onload = function (e) {
    const fullBase64 = e.target.result;

    selectedFile64String = fullBase64.split(",")[1];

    selectedFileType = file.type;
    selectedFileName = file.name;

    if (file.type === "application/pdf") {
      feePreviewImage.style.display = "none";

      feePreviewContainer.innerHTML = `
            <div class="fee-pdf-preview">
                📄 <strong>${file.name}</strong>
            </div>
        `;
    } else {
      feePreviewContainer.innerHTML = `
            <img id="feePreviewImage" class="fee-preview-image" src="${fullBase64}">
            <button type="button" id="feeRemoveImage" class="fee-remove-btn">✕</button>
        `;

      document
        .getElementById("feeRemoveImage")
        .addEventListener("click", removeFeeAttachment);
    }

    feePreviewContainer.style.display = "block";
  };

  reader.readAsDataURL(file);
});

function removeFeeAttachment() {
  feeScreenshot.value = "";

  selectedfile = null;
  selectedFile64String = "";
  selectedFileType = "";
  selectedFileName = "";

  feePreviewImage.src = "";
  feePreviewImage.style.display = "";

  feePreviewContainer.innerHTML = "";
  feePreviewContainer.style.display = "none";
}

async function feeDepositEntryClick() {
  const payload = {
    mobile: enteredMobileNumber,
  };
  const response = await CALL_API("GET_STD_INFO_FOR_FEE", payload);

  students = response.data;
  stdFatherName = students?.[0]?.fatherName ?? "";

  const yearSelect = document.getElementById("feeYear");
  yearSelect.innerHTML = "";
  const currentYear = new Date().getFullYear();

  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;

    if (year === currentYear) {
      option.selected = true;
    }

    yearSelect.appendChild(option);
  }

  feeStudentList.innerHTML = students
    .map(
      (student) => `
    <div class="fee-student-item">
        <input
            type="checkbox"
            id="feeStudent${student.admissionNo}"
            class="fee-student-checkbox"
            value="${student.admissionNo}"
        >
        <label
            for="feeStudent${student.admissionNo}"
            class="fee-student-label"
        >
            ${student.name} (${student.admissionNo})
        </label>
    </div>
`,
    )
    .join("");
  SHOW_SPECIFIC_DIV("feeManagerContainer");
  await populateFeeMasterGrid();
}

async function feeManagerSubmitButton() {
  const selectedStudents = document.querySelectorAll(
    ".fee-student-checkbox:checked",
  );
  const month = document.getElementById("feeMonth").value;
  const year = document.getElementById("feeYear").value;
  const amount = document.getElementById("feeAmount").value.trim();
  const comment = document.getElementById("feeComment").value.trim();

  // Validation

  if (selectedStudents.length === 0) {
    SHOW_ERROR_POPUP("Please select at least one student.");
    return;
  }

  if (!month) {
    SHOW_ERROR_POPUP("Please select the month.");
    return;
  }

  if (!year) {
    SHOW_ERROR_POPUP("Please select the year.");
    return;
  }

  if (!amount) {
    SHOW_ERROR_POPUP("Please enter the amount.");
    return;
  }

  if (Number(amount) <= 0) {
    SHOW_ERROR_POPUP("Please enter a valid amount.");
    return;
  }

  if (!selectedfile || !selectedFile64String) {
    SHOW_ERROR_POPUP("Please upload the fee payment screenshot.");
    return;
  }

  // Prepare Student List
  const students = [];

  const studentDisplay = Array.from(
    document.querySelectorAll(".fee-student-checkbox:checked"),
  )
    .map((checkbox) => {
      return document
        .querySelector(`label[for="${checkbox.id}"]`)
        .textContent.trim();
    })
    .join(", ");

  const payload = {
    loginMobileNo: enteredMobileNumber,
    students: studentDisplay,
    fatherName: stdFatherName,
    month: month,
    year: year,
    amount: Number(amount),
    comment: comment,
    selectedFile64String: selectedFile64String,
    selectedFileType: selectedfile?.type ?? "",
    selectedFileName: selectedfile?.name ?? "",
  };

  console.log(payload);

  const response = await CALL_API("SAVE_FEE_DEPOSIT_DATA", payload);
  if (response?.status === "success") {
    resetFee();
    SHOW_SUCCESS_POPUP("Data successfully saved.");
  } else {
    SHOW_ERROR_POPUP(response?.error);
  }
}

function feeManagerBackButton() {
  SHOW_SPECIFIC_DIV("parentMenuPopup");
  resetFee();
}

function resetFee() {
  // Uncheck all students
  document.querySelectorAll(".fee-student-checkbox").forEach((checkbox) => {
    checkbox.checked = false;
  });

  // Reset Month
  document.getElementById("feeMonth").selectedIndex = 0;

  // Reset Year to current year
  const currentYear = new Date().getFullYear();
  document.getElementById("feeYear").value = currentYear;

  // Reset Amount
  document.getElementById("feeAmount").value = "";

  // Reset Comment
  document.getElementById("feeComment").value = "";

  // Reset Screenshot
  document.getElementById("feeScreenshot").value = "";

  selectedfile = null;
  selectedFile64String = "";
  selectedFileType = "";
  selectedFileName = "";

  feePreviewImage.src = "";
  feePreviewContainer.innerHTML = "";
  feePreviewContainer.style.display = "none";
}

//---------------------------------------------------------------

const columnMap = {
  Status: 0,
  "Sewakarta Comment": 1,
  Date: 2,
  Datetime: 3,
  "Login Mobile No": 4,
  "Father Name": 5,
  "Student Names": 6,
  Month: 7,
  Year: 8,
  Amount: 9,
  Comment: 10,
  "File Url": 11,
};

const actions = [];

async function populateFeeMasterGrid() {
  const payload = {
    mobileNo: enteredMobileNumber,
  };
  const mergeConfig = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const response = await CALL_API_WITHOUT_LOADING(
    "GET_FEE_MASTER_GRID_DATA",
    payload,
  );
  const finalData = MERGE_SHEET_DATA(response?.data, mergeConfig);
  console.log(finalData);
  fillDynamicTableRows(finalData, "fmTableTHead", "fmTableTBody", actions, {
    enableSearch: true,
    enableSorting: true,
    searchPlaceholder: "Search records...",
    isFileNameThere: true,
    isFileURLThere: true,
    enableRowCount: true,
    columnMap: {
      Date: 2,
      Status: 0,
      "Sewakarta Comment": 1,
      "Student Names": 6,
      Month: 7,
      Year: 8,
      Amount: 9,
      "File Url": 11,
      Comment: 10,
    },
  });
}
