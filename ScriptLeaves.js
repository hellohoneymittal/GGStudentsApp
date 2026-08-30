let leaveData = {};

function resetFormFields() {
  document.querySelectorAll("form").forEach((form) => form.reset());
  document.querySelectorAll(".error").forEach((el) => {
    el.innerHTML = "";
  });
}

function buildFieldValueGrid(formId) {
  const columns = [
    {
      displayName: "Field",
      actualName: "field",
    },
    {
      displayName: "Value",
      actualName: "value",
    },
  ];

  const form = document.getElementById(formId);

  const gridData = [];
  const startInput = document.getElementById("startdate");
  const endInput = document.getElementById("enddate");
  const reason = document.getElementById("leaveReason");

  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffInDays = Math.round((endDate - startDate) / msPerDay) + 1;

  console.log(diffInDays);
  gridData.push({
    field: "Start Date",
    value: convertDateNew(startInput.value),
  });

  gridData.push({
    field: "End Date",
    value: convertDateNew(endInput.value),
  });

  gridData.push({
    field: "Number of Days",
    value: diffInDays,
  });

  gridData.push({
    field: "Reason",
    value: reason.value,
  });

  return { gridData, columns };
}

function resetLeaveForm(show_confirmation = 0) {
  document.getElementById("enddate").disabled = true;
  document.getElementById("leavesPassBtn").disabled = true;
  document.getElementById("leaveReason").disabled = true;

  show_confirmation == 1
    ? SHOW_CONFIRMATION_POPUP("Do you want to reset form?", resetFormFields)
    : resetFormFields();
}

function openLeavesWindow() {
  let start_next_day_window = "12:50";
  let [hs, ms] = start_next_day_window.split(":").map(Number);
  let startMinutes = hs * 60 + ms;
  let now = new Date();
  let currentMinutes = now.getHours() * 60 + now.getMinutes();
  const studentLeavesDiv = document.getElementById("studentLeavesHeading_div");
  const studentLeavesLabel = document.getElementById(
    "studentLeavesHeading_lbl",
  );
  let nextButton = document.getElementById("leavesPassBtn");
  const startInput = document.getElementById("startdate");
  const endInput = document.getElementById("enddate");
  const startErr = document.getElementById("startdateError");
  const endErr = document.getElementById("enddateError");
  const reasonBox = document.getElementById("leaveReason");
  const reasonBoxErr = document.getElementById("leaveReasonError");
  let disbaled_lable_class = "disabled-label";
  let enabled_lable_class = "custom-label-radio-content-custom-box";

  nextButton.disabled = true;
  endInput.disabled = true;
  startInput.innerHTML = "";
  endInput.innerHTML = "";

  nextButton.onclick = function () {
    moveNextStep();
  };

  studentLeavesDiv.style.display = "block";

  let offset = currentMinutes > startMinutes ? 1 : 0;

  // 🔹 Compute min start date
  let minStart = now;
  minStart.setDate(minStart.getDate() + offset);

  let minStartStr = minStart.toLocaleDateString("en-CA").split("T")[0];

  console.log(currentMinutes + " -> " + startMinutes + " -> " + minStartStr);

  // 🔹 Apply min to start date
  startInput.min = minStartStr;

  // 🔹 Validate start date
  startInput.addEventListener("change", function () {
    if (startInput.value < minStartStr) {
      startErr.innerText = `Start date must be ${offset === 1 ? "tomorrow" : "today"} or later`;
      startInput.value = "";
    } else {
      startErr.innerText = "";
      // 🔹 Set end date min = selected start date
      endInput.min = startInput.value;
      endInput.disabled = false;
      endInput.value = "";
      reasonBox.disabled = false;
    }

    if (startInput.value == "") {
      endInput.disabled = true;
      endInput.value = "";
      reasonBox.disabled = true;
      reasonBox.value = ""; // clear when disabled
      reasonBoxErr.innerHTML = "";
      nextButton.disabled = true;
    }
  });

  // 🔹 Validate end date
  endInput.addEventListener("change", function () {
    if (!endInput.value) {
      endErr.innerText = "";
      return;
    }

    if (endInput.value < startInput.value) {
      SHOW_ERROR_POPUP("End date cannot be earlier than start date");
      endInput.value = "";
    } else {
      endErr.innerText = "";
    }
  });

  reasonBox.addEventListener("input", function () {
    // 🔹 Remove only starting & ending spaces
    let text = reasonBox.value.trim().replace(/\s+/g, " ");

    if (text.length >= 15) {
      nextButton.disabled = false;
      reasonBoxErr.innerHTML = "";
    } else {
      nextButton.disabled = true;
      reasonBoxErr.innerHTML = "Please enter a minimum of 15 characters!";
    }
  });

  SHOW_SPECIFIC_DIV("studentLeavesContainer");
}

function moveNextStep() {
  const startInput = document.getElementById("startdate");
  const endInput = document.getElementById("enddate");
  const reasonBox = document.getElementById("leaveReason");

  endInput.value = endInput.value ? endInput.value : startInput.value;

  let result = buildFieldValueGrid("studentLeavesForm");

  leaveData["start"] = startInput.value;
  leaveData["end"] = endInput.value ? endInput.value : startInput.value;
  leaveData["reason"] = reasonBox.value.trim();
  leaveData["student"] = selectedStudent.studentName;
  leaveData["whatsapp"] = 0;

  console.log(leaveData);
  console.log(result.gridData);

  SHOW_CONFIRMATION_GRID_POPUP(
    result.gridData,
    result.columns,
    () => SHOW_CONFIRMATION_POPUP("Are you sure to proceed!", submitLeaves),
    "Submit",
    "Edit",
    "Verify Details!",
  );
}

async function submitLeaves() {
  let student_name = document.getElementById(
    "studentLeavesHeading_lbl",
  ).innerHTML;
  let whatsappClasses = ["Sri Hrishikesha", "Sri Padmanabha"];
  const outputData = await CALL_API(
    API_TYPE_CONSTANT.SUBMIT_STUDENT_LEAVES,
    leaveData,
  );

  if (
    outputData?.status &&
    outputData.data &&
    typeof outputData.data === "string"
  ) {
    console.log(outputData.data);
    if (outputData.data == "ok")
      SHOW_SUCCESS_POPUP(
        "Leaves submitted Successfully for " + student_name + "!",
        () => {
          if (whatsappClasses.includes(selectedStudent.stdClass)) {
            leaveData["whatsapp"] = selectedStudent.stdClass;
            CALL_API_WITHOUT_LOADING(
              API_TYPE_CONSTANT.SUBMIT_STUDENT_LEAVES,
              leaveData,
            );
          }

          SHOW_SPECIFIC_DIV("userMenuPopup");
        },
      );
    else
      SHOW_ERROR_POPUP(
        "Unable to submit leaves for: " +
          student_name +
          "!!\n\n" +
          outputData.data.split("ERR: ")[1],
      );
  } else
    SHOW_ERROR_POPUP("Unable to submit leaves for: " + student_name + "!!");

  return;
}
