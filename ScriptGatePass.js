let enteredMobileNumber = "";
let parentChildrenData = {};
let parentOf = "";

document
  .getElementById("parentMobileBox")
  .addEventListener("input", function () {
    let mobileNumber = this.value;
    let error_div = document.getElementById("parentMobileBoxError");
    error_div.innerHTML = "";
    const numPattern = /^[0-9]+$/;
    let submitButton = document.getElementById("submitMobileNumberBtn");

    submitButton.disabled = true;

    if (!numPattern.test(mobileNumber)) {
      error_div.innerHTML = "Please enter only digits!";
      return false;
    } else if (mobileNumber.length != 10) {
      error_div.innerHTML = "Please enter a valid mobile number!!";
      return;
    }

    submitButton.disabled = false;
  });

// Event listener for student gate pass checkbox
document
  .getElementById("gpStudentList")
  .addEventListener("change", function (e) {
    const inputs = document.querySelectorAll("#gpStudentList input");
    const checked = document.querySelectorAll("#gpStudentList input:checked");
    let submitButton = document.getElementById("gpNextBtn");
    const textbox = document.getElementById("gpReason");
    let erroDiv = document.getElementById("gpReasonError");

    submitButton.disabled = true;

    let requiresText = Array.from(checked).some((input) =>
      input.id.includes("_required"),
    );

    if (requiresText) {
      textbox.style.display = "block";
      textbox.disabled = false;
      erroDiv.innerHTML = "";
      erroDiv.style.display = "block";
      erroDiv.disabled = false;

      textbox.oninput = function () {
        let val = this.value.trim();

        if (val.length < 10) {
          erroDiv.innerHTML = "Minimum 10 characters required";
          submitButton.disabled = true;
        } else {
          erroDiv.innerHTML = "";
          submitButton.disabled = false;
        }
      };
    } else {
      textbox.style.display = "none";
      textbox.disabled = true;
      textbox.value = "";
      erroDiv.innerHTML = "";
      erroDiv.style.display = "none";
      erroDiv.disabled = true;
      submitButton.disabled = checked.length === 0;
    }
  });

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

async function submitMobileNumber() {
  let mobileNumber = document.getElementById("parentMobileBox").value;
  let error_div = document.getElementById("parentMobileBoxError");
  error_div.innerHTML = "";

  if (mobileNumber) {
    mobileNumber = mobileNumber.trim();
    enteredMobileNumber = mobileNumber;

    parentChildrenData = await CALL_API("CHECK_PARENT_MOBILE", {
      inputData: mobileNumber,
    });

    if (parentChildrenData?.status == "success" && parentChildrenData.data) {
      if (
        typeof parentChildrenData.data === "string" &&
        parentChildrenData.data.includes("ERR")
      ) {
        SHOW_ERROR_POPUP(parentChildrenData.data.split("ERR: ")[1]);
        return;
      }

      SHOW_SPECIFIC_DIV("parentMenuPopup");
    } else {
      error_div.innerHTML = "Please enter a valid mobile number!!";
      return;
    }
  } else {
    error_div.innerHTML = "Please enter a valid mobile number!!";
    return;
  }
}

function openStudentPassWindow() {
  if (parentChildrenData.data.infoMsg) {
    console.log(
      "Information from Parent Mobile Function:\n\n" +
        parentChildrenData.data.infoMsg,
    );
    SHOW_INFO_POPUP(parentChildrenData.data.infoMsg);
    SHOW_SPECIFIC_DIV("parentMenuPopup");
    return;
  }

  populateStudentListForGatePass(
    parentChildrenData.data.output,
    enteredMobileNumber,
  );
}

function populateStudentListForGatePass(input_list, input_mobile) {
  let text_element = document.getElementById("gpReason");
  text_element.value = "";
  text_element.style.display = "none";
  let currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  document.getElementById("gpNextBtn").disabled = true;

  let curr_time_converted = timeToMinutes(currentTime);

  let parent_popup = document.getElementById("gatePassStudentPopup");

  if (input_list.length == 0) {
    SHOW_INFO_POPUP(`No student(s) FOUND linked with number: ${input_mobile}`);
    return;
  }

  //Populate dynamic list
  const container = document.getElementById("gpStudentList");
  container.innerHTML = ""; // clear previous

  input_list.forEach((student) => {
    let lastClassTime = student.split(" - ")[1].trim();
    const id = `${student.split(" - ")[0]}`;

    let option_element = document.createElement("div");
    option_element.className = "options";

    let input_element = document.createElement("input");
    input_element.className = "custom-checkbox";
    input_element.name = `studentName_${input_mobile}`;
    input_element.type = "checkbox";
    input_element.value = id;
    input_element.id = id;

    let label_element = document.createElement("label");
    label_element.className = "custom-label-radio-content-custom-box";
    if (lastClassTime == "23:59") {
      console.log("Hosteler");
      label_element.classList.add("required");
      input_element.id += "_requiredHostel";
    } else if (
      curr_time_converted < timeToMinutes(lastClassTime) &&
      curr_time_converted > timeToMinutes("07:00")
    ) {
      label_element.classList.add("required");
      input_element.id += "_required";
    }

    label_element.innerHTML = id;

    option_element.appendChild(input_element);
    option_element.appendChild(label_element);

    container.append(option_element);
  });
  SHOW_SPECIFIC_DIV(parent_popup.id);
}

function resetGatePassForm() {
  // 🔹 Uncheck all checkboxes
  document
    .querySelectorAll('#gpStudentList input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));

  // 🔹 Disable submit button
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
  }

  // 🔹 Hide & reset textbox
  const textbox = document.getElementById("gpReason");

  if (textbox) {
    textbox.value = "";
    textbox.style.display = "none";
    textbox.disabled = true;
  }

  // 🔹 Clear error (if any)
  const error = document.getElementById("gpReasonError");
  if (error) {
    error.innerText = "";
  }
}

async function submitNames() {
  const selected = document.querySelectorAll("#gpStudentList input:checked");
  let selectedCheckboxes = Array.from(selected).map((el) => el.id);

  const textbox = document.getElementById("gpReason");

  let value = "";

  if (textbox.style.display !== "none") {
    value = textbox.value.trim();
  }

  console.log(selectedCheckboxes);

  const outputData = await CALL_API("SUBMIT_STUDENT_NAMES_PASS", {
    studentList: selectedCheckboxes,
    reason: value,
    mobileNum: selected[0].name.split("_")[1],
  });

  if (outputData?.status == "success" && outputData.data) {
    if (
      typeof outputData.data === "string" &&
      outputData.data.includes("ERR")
    ) {
      SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
      return;
    }

    if (outputData.data.infoMsg) {
      console.log(
        "Information from Parent Mobile Function:\n\n" +
          outputData.data.infoMsg,
      );
      SHOW_INFO_POPUP(outputData.data.infoMsg);
      SHOW_SPECIFIC_DIV("parentMenuPopup");
    }
  } else {
    SHOW_ERROR_POPUP("Internal error!");
    return;
  }
}
