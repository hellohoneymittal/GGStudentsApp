const hostlerRequiredDocuments = [
  // Clothing
  {
    label: "Kurta-Pajama with Waistcoat (for special events)",
    category: "Clothing",
    classes: "",
  },
  {
    label: "White Dhoti-Kurta For Programs (2 sets) ",
    category: "Clothing",
    classes: "",
  },
  {
    label: "Undergarments (6 sets)",
    category: "Clothing",
    classes: "",
  },
  // {
  //   label: "Lower & T-Shirts (6 sets - Gurukul + other colors)",
  //   category: "Clothing",
  //   classes: "",
  // },
  // {
  //   label: "School Uniform (5 sets)",
  //   category: "Clothing",
  //   classes: "",
  // },
  {
    label: "Warmers (2 sets)",
    category: "Clothing",
    classes: "",
  },
  {
    label: "Woolen Socks (8 pairs)",
    category: "Clothing",
    classes: "",
  },

  // Footwear
  { label: "Formal Sandals", category: "Footwear", classes: "" },
  { label: "Sports Shoes", category: "Footwear", classes: "" },
  { label: "Hawai Chappal", category: "Footwear", classes: "" },
  { label: "Extra Crocs", category: "Footwear", classes: "" },

  // Personal
  {
    label: "Pillow",
    category: "Personal",
    classes: "",
  },
  { label: "Water Bottles (2)", category: "Personal", classes: "" },
  {
    label: "Extra Spectacles (if applicable)",
    category: "Personal",
    classes: "",
  },

  // Toiletries
  {
    label:
      "Bathroom Kit (Comb, Oil, Cream, Toothbrush x3, Paste, Nail Cutter, Soap, Mirror, Tilak, Washing Soap)",
    category: "Toiletries",
    classes: "",
  },

  // Misc
  { label: "Gamchha (4)", category: "Misc", classes: "" },
  { label: "Kartal", category: "Misc", classes: "I, II, III, IV, V" },
  {
    label: "Mridanga (for boys)",
    category: "Misc",
    classes: "VI, VII, VIII, IX, X",
  },
  { label: "Swimming Costume", category: "Misc", classes: "" },

  // Bags
  { label: "Big Bag for clothes (Yatra)", category: "Bags", classes: "" },
  { label: "Small Bag (Yatra)", category: "Bags", classes: "" },
  { label: "Dholak Bag for Kambal (Yatra)", category: "Bags", classes: "" },
];

const requiredDocuments = [
  {
    label: "Father's Aadhar (2 Copies)",
    classes: "",
  },
  {
    label: "Mother's Aadhar (2 Copies)",
    classes: "",
  },
  {
    label: "Student's Aadhar (2 Copies)",
    classes: "",
  },
  {
    label: "Student's Photo (6 Copies)",
    classes: "",
  },
  {
    label: "Father's Photo (6 Copies)",
    classes: "",
  },
  {
    label: "Mother's Photo (6 Copies)",
    classes: "",
  },
  {
    label: "Original Student TC (Previous School)",
    classes: "I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII",
  },
  {
    label: "Parent Consent for Hostel Stay",
    classes: "",
  },
];

const questionGroups = [
  {
    id: "visitMethod",
    question: `
      Please confirm how the student will go home after school ? 
      <span class="entry-hindi-text">कृपया पुष्टि करें कि छात्र विद्यालय से घर कैसे जाएगा ?</span>
    `,
    type: "radio",
    options: [
      { value: "with_parent", label: "With Parent / Guardian" },
      { value: "without_parent", label: "Without Parent / Guardian" },
    ],
    selected: null,
  },
];
let isOtherItemDataAvailable = false;
let hostlerChecklistState = {};
let studentVisitType = "";
let selectedAnswers = [];
let formStatus = "";
let isOrderLocked = false;
let admissionData = [];
let allProducts = [];
let cart = {};
let collapsed = {};
let filtered = [];
let selectedStudentName = "";
let allStudentsData = {};
async function openAdmissionKitOpenScreen() {
  if (selectedTeacher?.userType === "teacher") {
    const response = await CALL_API("GET_ALL_STUDENTS_DATA", {});
    allStudentsData = response?.data || {};
    const studentNameKeys = Object.keys(response?.data || {});
    debugger;
    console.log(response);
    setupLiveSearch(
      "studentListInput",
      "studentListInputClrBtn",
      "studentListInputULList",
      function (selectedText) {
        selectedStudentName = selectedText?.trim();
      },
    );

    initializedLiveSearchControl(
      "studentListInput",
      "studentListInputClrBtn",
      "studentListInputULList",
      studentNameKeys,
    );
    SHOW_SPECIFIC_DIV("studentListPopup");
  } else {
    await callAdmiProcess();
  }
}

async function proceedForKit() {
  selectedStudent = allStudentsData[selectedStudentName];
  if (selectedStudent) {
    await callAdmiProcess();
  } else {
    SHOW_ERROR_POPUP("Please enter some value in textbox");
  }
}

async function callAdmiProcess() {
  await callAPIStudentAdmissionKit();
  if (isOtherItemDataAvailable) {
    await goToMainProcess();
  } else {
    await stdYearlyAdmissionKitProcessBtnClick();
  }
}

function shouldShowItem(item, applicationClass = "") {
  if (!item.classes || item.classes.trim() === "") return true;

  const allowedClasses = item.classes.split(",").map((c) => c.trim());
  return allowedClasses.includes(applicationClass);
}

function handleHostlerChecklist(item, isChecked) {
  hostlerChecklistState[item] = isChecked;

  checkAllDocumentsAndQuestions();
}

async function stdYearlyAdmissionKitProcessBtnClick() {
  SHOW_SPECIFIC_DIV("StdYearlyAdmissionKitEntryContianer");
  renderQuestions();
}

function groupByCategory(data, applicationClass = "") {
  const grouped = {};

  data.forEach((item) => {
    if (!shouldShowItem(item, applicationClass)) return;

    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }

    grouped[item.category].push(item);
  });

  return grouped;
}

// Render function (call this on entry load)
function renderQuestions() {
  const container = document.getElementById("StdYearlyEntry");

  let html = `
  <div class="entry-mapping-box">
    <h4>Student Movement</h4>
    <div class="entry-output">
`;

  questionGroups.forEach((group) => {
    html += `
    <ul>
      <li class="entry-question-header entry-hindi-text">
        ${group.question}
      </li>
  `;

    const isHostler = selectedStudent.hostler === "Y";

    if (isHostler) {
      const withoutParentOption = group.options.find(
        (opt) => opt.label === "Without Parent / Guardian",
      );
      if (withoutParentOption) {
        group.selected = withoutParentOption.value;
        selectedAnswers[group.id] = withoutParentOption.value;
      }
    }

    group.options.forEach((opt, oIndex) => {
      const inputId = `q_${group.id}_${oIndex}`;

      const isWithoutParent = opt.label === "Without Parent / Guardian";

      const isChecked =
        (isHostler && isWithoutParent) ||
        (!isHostler && group.selected === opt.value);

      const isDisabled = isHostler && !isWithoutParent;

      html += `
    <li>
      <label class="entry-checkbox-row">
        <input 
          type="${group.type}" 
          name="${group.id}" 
          id="${inputId}" 
          value="${opt.value}" 
          onchange="handleQuestionChange('${group.id}', this.value)"
          ${isChecked ? "checked" : ""}
          ${isDisabled ? "disabled" : ""}
        />
        <span class="entry-checkbox-lbl">${opt.label}</span>
      </label>
    </li>
  `;
    });

    html += `</ul>`;
  });

  html += `</div></div>`;

  // Documents checklist
  html += `
  <div class="entry-mapping-box">
    <h4>Document Verification</h4>
    <div class="entry-output">
      <p class="entry-subtitle">Please confirm all documents are submitted</p>
      <ul>
`;

  requiredDocuments.forEach((doc) => {
    const isHostler = selectedStudent?.hostler === "Y";

    if (doc.label === "Parent Consent for Hostel Stay" && !isHostler) {
      return;
    }

    if (!shouldShowItem(doc, selectedStudent?.studentOrgClassName)) return;

    html += `
    <li>
      <label class="entry-checkbox-row">
        <input 
          type="checkbox" 
          name="requriedCheckBox" 
          onchange="checkAllDocumentsAndQuestions()" 
        />
        <span>${doc.label}</span>
      </label>
    </li>
  `;
  });

  html += `
      </ul>
    </div>
  </div>
`;

  if (selectedStudent.hostler === "Y") {
    html += `
  <div class="entry-mapping-box">
    <h4>Hostler Essentials</h4>
    <p class="entry-subtitle">
      Please ensure all the above items are arranged. You may take assistance from the hostel team if required.
    </p>
    <div class="entry-output">
`;

    const groupedData = groupByCategory(
      hostlerRequiredDocuments,
      selectedStudent?.studentOrgClassName,
    );

    Object.keys(groupedData).forEach((category) => {
      html += `<h4>${category}</h4><ul>`;

      groupedData[category].forEach((item) => {
        html += `
      <li>
        <label class="entry-checkbox-row">
          <input 
            type="checkbox"
            onchange="handleHostlerChecklist('${item.label}', this.checked)"
          />
          <span class="entry-checkbox-lbl">${item.label}</span>
        </label>
      </li>
    `;
      });

      html += `</ul>`;
    });

    html += `
    </div>
  </div>
`;
  }

  html += `
      </div>
      <div class="entry-btn-row">
        <button class="entry-next-btn" id="entryNextBtn" disabled onclick="goToMainProcess()">
          Next
        </button>
      </div>
    </div>
  `;

  html += `</div>`;
  container.innerHTML = html;
}

// Handle radio change
function handleQuestionChange(questionId, selectedValue) {
  selectedAnswers[questionId] = selectedValue;
  const group = questionGroups.find((g) => g.id === questionId);
  if (!group) return;
  group.selected = selectedValue;
  checkAllDocumentsAndQuestions();
}

// Validation
function checkAllDocumentsAndQuestions() {
  const checkboxes = document.querySelectorAll('[name="requriedCheckBox"]');
  const nextBtn = document.getElementById("entryNextBtn");

  const allChecked = [...checkboxes].every((cb) => cb.checked);

  const allQuestionsAnswered = questionGroups.every((q) => q.selected !== null);

  if (allChecked && allQuestionsAnswered) {
    nextBtn.disabled = false;
    nextBtn.classList.remove("disabled"); // optional styling
  } else {
    nextBtn.disabled = true;
    nextBtn.classList.add("disabled"); // optional styling
  }
}

function buildEntryPayload() {
  const payload = {
    student: selectedStudent,
    questions: {},
    documents: [],
    hostlerItems: [],
  };

  questionGroups.forEach((group) => {
    const selected = document.querySelector(
      `input[name="${group.id}"]:checked`,
    );

    if (selected) {
      payload.questions[group.id] = selected.value;
    }
  });

  document
    .querySelectorAll('input[name="requriedCheckBox"]:checked')
    .forEach((cb) => {
      const label = cb.nextElementSibling?.innerText || "";
      payload.documents.push(label);
    });

  document
    .querySelectorAll(
      'input[type="checkbox"][onchange^="handleHostlerChecklist"]',
    )
    .forEach((cb) => {
      if (cb.checked) {
        const label = cb.nextElementSibling?.innerText || "";
        payload.hostlerItems.push(label);
      }
    });

  return payload;
}

async function callAPIStudentAdmissionKit() {
  const payload = {
    student: selectedStudent,
  };
  const response = await CALL_API(
    "RETRIEVE_ADMISSION_ITEMS_FOR_STUDENT",
    payload,
  );
  if (response?.status === "success") {
    admissionData = response?.data?.admissionData;
    isOtherItemDataAvailable = response?.data?.isOtherItemDataAvailable;
    console.log("admissionData   ", admissionData);

    allProducts = admissionData.map((item, i) => ({
      ...item,
      id: i + 1,
    }));
    debugger;
    isOrderLocked =
      selectedTeacher?.userType === "teacher"
        ? false
        : admissionData.some(
            (item) =>
              item.formStatus.trim() === "paymentRecd" ||
              item.deliveryStatus.trim() === "delivered",
          );

    filtered = [...allProducts];
  } else {
    SHOW_ERROR_POPUP("Something Went Wrong");
  }
}

async function goToMainProcess() {
  const entryPayload = buildEntryPayload();

  toggleOrderLockUI();
  initCart();
  renderStuAdmKit();
  SHOW_SPECIFIC_DIV("StdYearlyAdmissionKitProcessContainer");
  const container = document.getElementById(
    "StdYearlyAdmissionKitProcessContainer",
  );
  container.scrollTop = 0;
  container.scrollIntoView({ behavior: "smooth" });
}

function toggleOrderLockUI() {
  debugger;
  const submitBtn = document.getElementById("finalSubmitBtn");
  const commentBox = document.getElementById("commentText");

  if (!submitBtn || !commentBox) return;

  if (isOrderLocked) {
    commentBox.disabled = true;
    submitBtn.disabled = false;
    submitBtn.classList.add("disabled-submit-btn"); // CSS class to gray out
    commentBox.classList.add("disabled-textarea");

    submitBtn.title =
      "Order already submitted. Please contact Gurukul Admission for modifications.";
  } else {
    commentBox.disabled = false;
    submitBtn.disabled = false;
    submitBtn.classList.remove("disabled-submit-btn");
    commentBox.classList.remove("disabled-textarea");
    submitBtn.title = "";
  }
}

function initCart() {
  cart = {};
  allProducts.forEach((p) => {
    if (p.rowIndex > 0 && Number(p.qty) > 0) {
      cart[p.id] = Number(p.qty); // existing order
    } else {
      cart[p.id] = Number(p.min); // fresh order → force min
    }
  });
}

function clearSearch() {
  document.getElementById("search-box").value = "";
  ggFilterProducts();
}

function ggFilterProducts() {
  const q = document.getElementById("search-box").value.toLowerCase();

  document
    .getElementById("clear-btn")
    .classList.toggle("visible", q.length > 0);

  if (q) {
    filtered = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );

    // ✅ AUTO EXPAND matched categories
    collapsed = {};
    filtered.forEach((p) => {
      collapsed[p.category] = false;
    });
  } else {
    filtered = [...allProducts];

    // optional: reset collapse when search cleared
    collapsed = {};
  }

  renderStuAdmKit();
}

function toggleCategory(cat) {
  collapsed[cat] = !collapsed[cat];
  renderStuAdmKit();
}

function updateQty(id, change) {
  const p = allProducts.find((x) => x.id === id);
  if (!p) return;

  let qty = getQty(p) + change;

  if (qty < p.min) qty = p.min;
  if (qty > p.max) qty = p.max;

  cart[id] = qty;

  renderStuAdmKit();
}

function ggResetForm() {
  initCart();
  renderStuAdmKit();
}

function renderStuAdmKit() {
  const list = document.getElementById("product-list");
  list.innerHTML = "";

  const categories = [...new Set(filtered.map((p) => p.category))];

  if (categories.length === 0) {
    list.innerHTML = '<p class="empty-msg">No items found.</p>';
    renderPendingGrid();
    return;
  }

  categories.forEach((cat) => {
    const items = filtered.filter((p) => p.category === cat);
    const catTotal = items.reduce(
      (s, p) => s + p.price * (cart[p.id] ?? p.min),
      0,
    );

    // if (collapsed[cat] === undefined) {
    //   collapsed[cat] = isOrderLocked ? true : false; // first load default
    // }
    const isCollapsed = collapsed[cat]; // now we just read it

    const block = document.createElement("div");
    block.className = "category-block";

    block.innerHTML = `
      <button class="category-header ${isCollapsed ? "collapsed" : ""}" onclick="toggleCategory('${cat}')">
        <h3>${cat}</h3>
        <div class="cat-right">
          <span class="cat-total">₹${catTotal}</span>
          <span class="chevron">▲</span>
        </div>
      </button>
      <div class="category-body ${isCollapsed ? "hidden" : ""}">
        ${items
          .map((p) => {
            const qty = getQty(p);
            const fixed = p.min === p.max;
            const active = qty > 0;

            const orderedQty = Number(qty);
            const deliveredQty = Number(p.deliveredQty || 0);
            const pendingQty = Math.max(0, orderedQty - deliveredQty);

            let statusTag = "";
            if (pendingQty === 0 && deliveredQty > 0) {
              statusTag = `<span class="delivery-tag delivered">Delivered</span>`;
            } else if (deliveredQty > 0) {
              statusTag = `<span class="delivery-tag partial">Partial (${pendingQty} pending)</span>`;
            } else {
              statusTag = `<span class="delivery-tag pending">Pending</span>`;
            }

            // Lock condition
            const lockMinus = isOrderLocked || qty - deliveredQty <= 0; // pending 0 ho gaya to minus lock
            const lockPlus = isOrderLocked || qty >= p.max || fixed;

            return `
            <div class="product-card ${active ? "active" : ""}">
              <div class="product-info">
                <div class="name">${p.name}</div>
                <div class="meta">
                  ₹${p.price}/item · Min ${p.min} · Max ${p.max}
                  ${statusTag}
                </div>
              </div>
              <div class="qty-controls">
                <button class="qty-btn"
                  onclick="updateQty(${p.id},-1)"
                  ${lockMinus ? "disabled" : ""}>−</button>
                <span class="qty-val">${qty}</span>
                <button class="qty-btn"
                  onclick="updateQty(${p.id},1)"
                  ${lockPlus ? "disabled" : ""}>+</button>
              </div>
              <div class="line-total">₹${p.price * qty}</div>
            </div>`;
          })
          .join("")}
      </div>`;

    list.appendChild(block);
  });

  renderPendingGrid();
  togglePendingSection();
  renderSelectionReview();
}

function getQty(p) {
  // user ne change kiya hai
  if (cart[p.id] !== undefined) return cart[p.id];

  // existing order
  if (p.rowIndex > 0 && Number(p.qty) > 0) return Number(p.qty);

  // fresh order
  return Number(p.min);
}

function updateSummary() {
  let total = 0;

  allProducts.forEach((p) => {
    const qty = getQty(p);
    total += p.price * qty;
  });

  document.getElementById("total-price").textContent = total;
}

function renderPendingGrid() {
  const gridContainer = document.getElementById("pending-grid");

  if (!gridContainer) return;

  const pendingItems = filtered.filter((p) => p.deliveryStatus === "pending");

  if (!pendingItems.length) {
    gridContainer.innerHTML = '<div class="empty-msg"></div>';
    return;
  }

  gridContainer.innerHTML = `
    <div class="pending-grid">
      ${pendingItems
        .map(
          (p) => `
        <div class="pending-card">
          <div class="p-name">${p.name}</div>
          <div class="p-cat">${p.category}</div>
          <div class="p-status">Pending</div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

function togglePendingSection() {
  console.log("togglePendingSection called");

  const container = document.getElementById("pending-container");

  if (!container) {
    console.log("pending-container NOT FOUND");
    return;
  }

  container.style.display = isOrderLocked ? "block" : "none";
}

function renderSelectionReview() {
  const container = document.getElementById("checkout-summary-list");
  const totalContainer = document.getElementById("checkout-grand-total");

  if (!container) return;

  let grandTotal = 0;

  const selectedItems = allProducts.filter((p) => {
    const qty = cart[p.id] ?? p.min;
    return qty > 0;
  });

  if (!selectedItems.length) {
    container.innerHTML = `<div class="empty-msg">No items selected</div>`;
    totalContainer.textContent = "0";
    return;
  }

  container.innerHTML = selectedItems
    .map((p) => {
      const qty = cart[p.id] ?? p.min;
      const itemTotal = qty * p.price;
      grandTotal += itemTotal;

      return `
      <div class="checkout-item-row">
        <div class="checkout-item-left">
          <div class="checkout-item-name">${p.name}</div>
          <div class="checkout-item-meta">${qty} × ₹${p.price}</div>
        </div>
        <div class="checkout-item-amount">₹${itemTotal}</div>
      </div>
    `;
    })
    .join("");

  totalContainer.textContent = grandTotal;
}

async function ggStdYearlyKitSubmitForm() {
  if (isOrderLocked) {
    SHOW_ERROR_POPUP(
      "Some items in your order have already been processed. For any modifications, please contact the Finance Team, as only they have permission to make changes.",
    );
    return false;
  } else {
    try {
      const comment = document.getElementById("commentText")?.value || "";

      // 🔹 Admit Card Type
      let admitCardType = "";
      const visit = selectedAnswers["visitMethod"];

      if (visit === "with_parent") {
        admitCardType = "Blue";
      } else if (visit === "without_parent") {
        admitCardType = "Orange";
      }

      // 🔥 Detect First Save
      const isFirstSave = allProducts.every(
        (p) => !p.rowIndex || p.rowIndex === 0,
      );

      let itemsPayload = [];

      const firstExistingItem = allProducts.find(
        (p) => p.rowIndex && p.rowIndex !== 0,
      );

      const commonFields = {
        comment: firstExistingItem?.comment,
        formStatus: firstExistingItem?.formStatus,
        admitCardType: firstExistingItem?.admitCardType,
        amountRecd: firstExistingItem?.amountRecd,
      };

      if (isFirstSave) {
        //  FIRST SAVE → only qty > 0
        itemsPayload = allProducts
          .map((p) => {
            const qty = cart[p.id] ?? p.min;

            if (qty > 0) {
              return {
                id: p.id,
                category: p.category,
                name: p.name,
                price: p.price,
                quantity: qty,
                total: qty * p.price,
                min: p.min,
                max: p.max,
                deliveryStatus: "pending",
                deliveredQty: "",
                formStatus: "submitted",
                admitCardType: admitCardType,
                amountRecd: "",
                rowIndex: 0,
              };
            }
            return null;
          })
          .filter(Boolean);
      } else {
        itemsPayload = allProducts
          .map((p) => {
            const qty = cart[p.id] ?? p.min;

            //  skip: never existed + still 0
            if ((!p.rowIndex || p.rowIndex === 0) && qty === 0) {
              return null;
            }

            // बाकी sab bhejo (including qty = 0 for existing rows)
            return {
              id: p.id,

              category: p.category,
              name: p.name,
              price: p.price,
              quantity: qty,
              total: qty * p.price,
              min: p.min,
              max: p.max,
              deliveryStatus: p.deliveryStatus || "pending",
              deliveredQty: p.deliveredQty,
              rowIndex: p.rowIndex,
              ...commonFields,
            };
          })
          .filter(Boolean);
      }

      // 🔹 Grand Total (always full calc)
      const grandTotal = allProducts.reduce((sum, p) => {
        const qty = cart[p.id] ?? p.min;
        return sum + (qty > 0 ? qty * p.price : 0);
      }, 0);

      const finalPayload = {
        student: selectedStudent,
        comment: comment,
        formStatus: "submitted",
        items: itemsPayload,
        grandTotal: grandTotal,
        isFirstSave: isFirstSave, // 🔥 important for backend
      };

      console.log("FINAL PAYLOAD:", finalPayload);

      if (itemsPayload.length === 0) {
        SHOW_ERROR_POPUP("No changes to save.");
        return;
      }

      const response = await CALL_API("SAVE_ADMISSION_KIT", finalPayload);

      if (response?.status === "success") {
        SHOW_SUCCESS_POPUP("Saved successfully.");
        resetAdmissionKitState();
      } else {
        SHOW_ERROR_POPUP("Failed to save data.");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      SHOW_ERROR_POPUP("Something went wrong.");
    }
  }
}

function resetAdmissionKitState() {
  formStatus = "";
  isOrderLocked = false;
  admissionData = [];
  allProducts = [];
  cart = {};
  collapsed = {};
  filtered = [];

  const commentBox = document.getElementById("commentText");
  if (commentBox) {
    commentBox.value = "";
  }
  if (selectedTeacher?.userType === "teacher") {
    SHOW_SPECIFIC_DIV("studentListPopup");
  } else {
    SHOW_SPECIFIC_DIV("userMenuPopup");
  }
}

function backBtnYearlyAdminKit() {
  if (selectedTeacher?.userType === "teacher") {
    SHOW_CONFIRMATION_POPUP(
      "Are you sure you want to go back?",
      backToAllStuWindow,
    );
  } else {
    SHOW_CONFIRMATION_POPUP(
      "Are you sure you want to go back? All filled form data will be cleared.",
      resetAdmissionKitState,
    );
  }
}

function backToAllStuWindow() {
  formStatus = "";
  isOrderLocked = false;
  admissionData = [];
  allProducts = [];
  cart = {};
  collapsed = {};
  filtered = [];

  const commentBox = document.getElementById("commentText");
  if (commentBox) {
    commentBox.value = "";
  }
  SHOW_SPECIFIC_DIV("studentListPopup");
}

function backToUserMenu() {
  SHOW_SPECIFIC_DIV("userMenuPopup");
}
