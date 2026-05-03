const department = document.getElementById("feedbackDepartment");
const comment = document.getElementById("feedbackComment");
const commentError = document.getElementById("feedbackCommentError");
const submitBtn = document.getElementById("submitFeedbackFromBtn");

// Enable textarea when department selected
department.addEventListener("change", function () {
  if (this.value !== "") {
    comment.disabled = false;
    comment.focus();
  } else {
    comment.disabled = true;
    submitBtn.disabled = true;
    comment.value = "";
  }
});

// Enable submit only if 30+ characters
comment.addEventListener("input", function () {
  const textLength = this.value.trim().length;
  if (textLength < 30) {
    submitBtn.disabled = true;
    commentError.innerHTML = "Minimum 30 characters needed!";
  } else {
    submitBtn.disabled = false;
    commentError.innerHTML = "";
  }
});

function resetFeedbackForm() {
  document.getElementById("feedbackForm").reset();
  commentError.innerHTML = "";
}

async function submitFeedback() {
  let value = comment.value;
  let dept_value = department.value;

  const outputData = await CALL_API("SUBMIT_PARENT_FEEDBACK", {
    mobileNumber: enteredMobileNumber,
    comment: value,
    department: dept_value,
  });

  if (outputData?.status == "success" && outputData.data) {
    if (
      typeof outputData.data === "string" &&
      outputData.data.includes("ERR")
    ) {
      SHOW_ERROR_POPUP(outputData.data.split("ERR: ")[1]);
      return;
    }

    SHOW_SUCCESS_POPUP(
      "Feedback submitted successfully!\n\nPlease track the status through this App!",
      SHOW_SPECIFIC_DIV("parentMenuPopup"),
    );
  } else {
    SHOW_ERROR_POPUP("Internal error!");
    return;
  }
}
