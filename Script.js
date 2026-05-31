let selectedStudent = {};
let selectedTeacher = {};
let student_label_arr = [
  "showAcademicReportsHeading_lbl",
  "showAttendanceReportsHeading_lbl",
  "computerExamHeading_lbl",
  "showExamSyllabusHeading_lbl",
];

document.querySelectorAll(".accordion-header").forEach((header) => {
  header.addEventListener("click", () => {
    const content = header.nextElementSibling;

    content.classList.toggle("show");

    header.classList.toggle("active");
  });
});

document.getElementById("passworTxtBox").addEventListener("input", function () {
  let password_input = this.value;
  let error_div = document.getElementById("passworTxtBoxError");
  error_div.innerHTML = "";
  const numPattern = /^[0-9]+$/;
  let submitButton = document.getElementById("submitPassBtn");

  submitButton.disabled = true;

  if (password_input.length < 8) {
    return;
  }

  submitButton.disabled = false;
});

async function openLoginScreen() {
  document.getElementById("passworTxtBox").value = "";
  document.getElementById("passworTxtBoxError").innerHTML = "";
  document.getElementById("submitPassBtn").disabled = true;

  const loginData = await DB_GET(
    INDEX_DB.storeKey,
    INDEX_DB.dbName,
    INDEX_DB.storeName,
  );

  if (loginData) {
    if (loginData?.userType === "student") {
      selectedStudent = loginData;
    } else {
      selectedTeacher = loginData;
      selectedStudent = loginData;
    }

    proceedStdLogin(loginData);
  } else {
    SHOW_SPECIFIC_DIV("passwordPopup");
  }
}

function proceedStdLogin(selectedData) {
  console.log(selectedData);
  if (selectedData?.userType) {
    SHOW_SPECIFIC_DIV("userMenuPopup");
    if (selectedData.userType === "student") {
      document.getElementById("login-user-name-lbl_user").innerText =
        selectedData.studentOrgName;

      //Populating all info blocks
      for (i = 0; i < student_label_arr.length; i++) {
        document.getElementById(student_label_arr[i]).innerText =
          `${selectedData.studentOrgName}`;
      }
    } else {
      document.getElementById("login-user-name-lbl_user").innerText =
        `Teacher - ${selectedData.name}`;
    }

    const popup = document.getElementById("userMenuPopup");
    if (!popup) return;

    const userType = selectedData?.userType;

    const allButtons = popup.querySelectorAll("button");

    //  STUDENT → SHOW ALL
    if (userType === "student") {
      allButtons.forEach((btn) => {
        if (!btn.classList.contains("accordion-header")) {
          btn.style.display = "block";
        }
      });

      return;
    }

    // (Teacher/Admin)
    allButtons.forEach((btn) => {
      btn.style.display = "none";
    });

    // Show only specific buttons
    document.getElementById("logoutBtn").style.display = "block";

    if (
      userType === "teacher" &&
      selectedData?.role["UT Syllabus App Role"].toString().trim() === "Admin"
    ) {
      document.getElementById("stdYearlyAdmissionKitProcessBtn").style.display =
        "block";
    }
  } else {
    document.getElementById("passworTxtBox").value = "";
    document.getElementById("passworTxtBoxError").innerHTML = "";
    SHOW_SPECIFIC_DIV("passwordPopup");
  }
}

async function submitPass() {
  const now = new Date();

  let password = GetControlValue("passworTxtBox");
  let error_div = document.getElementById("passworTxtBoxError");
  error_div.innerHTML = "";

  if (password) {
    password = password.trim();
    inputPassword = password;
    const response = await CALL_API("CHECK_STUDENT_PASSWORD", {
      password: inputPassword,
    });

    if (response?.status == "success" && response.data) {
      await DB_SET(
        INDEX_DB.storeKey,
        response.data,
        INDEX_DB.dbName,
        INDEX_DB.storeName,
      );
      if (response?.data && response?.data?.userType === "student") {
        selectedStudent = response.data;
      } else {
        selectedTeacher = response.data;
      }

      proceedStdLogin(response.data);
    } else {
      error_div.innerHTML = "Please enter correct password!!";
      return;
    }
  } else {
    error_div.innerHTML = "Please enter correct password!!";
    return;
  }
}

async function onLogoutClick() {
  selectedStudent = {};
  selectedTeacher = {};
  await DB_DELETE(INDEX_DB.storeKey, INDEX_DB.dbName, INDEX_DB.storeName);
  document.getElementById("passworTxtBox").value = "";
  document.getElementById("passworTxtBoxError").innerHTML = "";
  SHOW_SPECIFIC_DIV("mainMenuPopup");
}
