let startButton = document.getElementById("start");
let endButton = document.getElementById("end");
let taskSelect = document.getElementById("task");
let outputTable = document.getElementById("output");
let exportButton = document.getElementById("export");
let startTime = null;

window.addEventListener("beforeunload", function (event) {
  event.preventDefault();
  event.returnValue = "";
});

if (localStorage.getItem("taskOptions")) {
  taskSelect.innerHTML = localStorage.getItem("taskOptions");
}

if (localStorage.getItem("outputTableData")) {
  outputTable.innerHTML = localStorage.getItem("outputTableData");
  outputTable.querySelectorAll("td:nth-child(5), td:nth-child(6)").forEach(cell => {
    cell.contentEditable = true;
    cell.addEventListener("blur", () => {
      localStorage.setItem("outputTableData", outputTable.innerHTML);
    });
  });
}

function addTask() {
  let taskName = prompt("Enter the name of the task:");
  let newOption = document.createElement("option");
  newOption.innerHTML = taskName;
  newOption.value = taskName;
  taskSelect.appendChild(newOption);
  saveOptions();
}

function deleteTask() {
  let index = taskSelect.selectedIndex;
  if (index > 0) {
    if (confirm("Are you sure you want to delete this task?")) {
      taskSelect.removeChild(taskSelect.options[index]);
      saveOptions();
    }
  }
}

function saveOptions() {
  localStorage.setItem("taskOptions", taskSelect.innerHTML);
}

startButton.addEventListener("click", function () {
  const timeRows = document.querySelectorAll('table tr');
  // Delete all rows containing the words "Total Time"
  for (let i = 1; i < timeRows.length; i++) {
    if (timeRows[i].textContent.includes("Total Time")) {
      timeRows[i].remove();
    }
  }
  for (let i = 1; i < timeRows.length; i++) {
    if (timeRows[i].textContent.includes("Overall Total")) {
      timeRows[i].remove();
    }
  }
  if (taskSelect.value !== "") {
    startButton.disabled = true;
    endButton.disabled = false;
    startTime = new Date();
    let row = outputTable.insertRow(-1);
    let taskCell = row.insertCell(0);
    let startTimeCell = row.insertCell(1);
    let endTimeCell = row.insertCell(2);
    let durationCell = row.insertCell(3);
    let countCell = row.insertCell(4);
    let commentCell = row.insertCell(5);
    taskCell.innerHTML = taskSelect.value;
    startTimeCell.innerHTML = startTime.toLocaleTimeString();
    endTimeCell.innerHTML = "";
    durationCell.innerHTML = "";
    countCell.contentEditable = true;
    countCell.addEventListener("blur", function () {
      localStorage.setItem("outputTableData", outputTable.innerHTML);
    });
    commentCell.contentEditable = true;
    commentCell.addEventListener("blur", function () {
      localStorage.setItem("outputTableData", outputTable.innerHTML);
    });
    localStorage.setItem("outputTableData", outputTable.innerHTML);
  }
});

endButton.addEventListener("click", function () {
  if (startTime !== null) {
    startButton.disabled = false;
    endButton.disabled = true;
    let endTime = new Date();
    let duration = Math.round((endTime - startTime) / 1000);
    let lastRow = outputTable.rows[outputTable.rows.length - 1];
    lastRow.cells[2].innerHTML = endTime.toLocaleTimeString();
    lastRow.cells[3].innerHTML = formatDuration(duration);
    startTime = null;
    localStorage.setItem("outputTableData", outputTable.innerHTML);
  }
});

function formatDuration(duration) {
  if (duration === 0 || isNaN(duration)) {
    return "00:00:00";
  }
  let hours = Math.floor(duration / 3600);
  let minutes = Math.floor((duration % 3600) / 60);
  let seconds = Math.floor(duration % 60);
  return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
}

function pad(num) {
  return num.toString().padStart(2, "0");
}

exportButton.addEventListener("click", function () {

  displayTotalProcessingTime();

  let rows = outputTable.rows;
  let data = [];
  for (let i = 0; i < rows.length; i++) {
    let cells = rows[i].cells;
    let rowData = [];
    for (let j = 0; j < cells.length; j++) {
      let cellText = cells[j].innerText;
      rowData.push(cellText);
    }
    data.push(rowData);
  }
  let key = "000";
  let workbook = XLSX.utils.book_new();
  let worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet["!protect"] = {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
    objects: false,
    scenarios: false,
    password: key
  };
  XLSX.utils.book_append_sheet(workbook, worksheet, "Time Tracker");
  XLSX.writeFile(workbook, "time-tracker.xlsx");
});

function displayTotalProcessingTime() {
  let timeRows = document.querySelectorAll('table tr');

  // Delete all rows containing the words "Total Time"
  for (let i = 1; i < timeRows.length; i++) {
    if (timeRows[i].textContent.includes("Total Time")) {
      timeRows[i].remove();
    }
  }

  // Delete the "Overall Total" row
  for (let i = 1; i < timeRows.length; i++) {
    if (timeRows[i].textContent.includes("Overall Total")) {
      timeRows[i].remove();
    }
  }

  // Reassign the timeRows variable to include only the remaining rows
  timeRows = document.querySelectorAll('table tr');

  let processingTimes = {};

  for (let i = 1; i < timeRows.length; i++) {
    const task = timeRows[i].cells[0].textContent;
    const timeParts = timeRows[i].cells[3].textContent.split(':');
    const hoursToMs = parseInt(timeParts[0]) * 60 * 60 * 1000;
    const minutesToMs = parseInt(timeParts[1]) * 60 * 1000;
    const secondsToMs = parseInt(timeParts[2]) * 1000;
    const timeInMs = hoursToMs + minutesToMs + secondsToMs;

    if (!processingTimes[task]) {
      processingTimes[task] = 0;
    }
    processingTimes[task] += timeInMs;
  }

  let overallTotalProcessingTime = 0;

  for (const task in processingTimes) {
    const totalProcessingTime = processingTimes[task];
    const hours = Math.floor(totalProcessingTime / (60 * 60 * 1000)).toString().padStart(2, '0');
    const minutes = Math.floor((totalProcessingTime % (60 * 60 * 1000)) / (60 * 1000)).toString().padStart(2, '0');
    const seconds = Math.floor((totalProcessingTime % (60 * 1000)) / 1000).toString().padStart(2, '0');
    const totalProcessingTimeFormatted = `${hours}:${minutes}:${seconds}`;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `<td colspan="2"></td><td><strong>Total Time for ${task}:</strong></td><td><strong>${totalProcessingTimeFormatted}</strong></td><td></td><td></td>`;
    document.querySelector('table tbody').appendChild(newRow);

    overallTotalProcessingTime += totalProcessingTime;
  }

  const overallHours = Math.floor(overallTotalProcessingTime / (60 * 60 * 1000)).toString().padStart(2, '0');
  const overallMinutes = Math.floor((overallTotalProcessingTime % (60 * 60 * 1000)) / (60 * 1000)).toString().padStart(2, '0');
  const overallSeconds = Math.floor((overallTotalProcessingTime % (60 * 1000)) / 1000).toString().padStart(2, '0');
  const overallTotalProcessingTimeFormatted = `${overallHours}:${overallMinutes}:${overallSeconds}`;

  const overallTotalRow = document.createElement('tr');
  overallTotalRow.innerHTML = `<td colspan="2"></td><td><strong>Overall Total:</strong></td><td><strong>${overallTotalProcessingTimeFormatted}</strong></td><td></td><td></td>`;
  document.querySelector('table tbody').appendChild(overallTotalRow);

  // Delete all rows containing the string "NaN:NaN:NaN"
  const invalidRows = document.querySelectorAll('table tr');
  for (let i = 1; i < invalidRows.length; i++) {
    const rowText = invalidRows[i].textContent.trim();
    if (rowText.includes("NaN:NaN:NaN")) {
      invalidRows[i].remove();
    }
  }
}

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.code === "KeyU") {
    event.preventDefault();
  }
  if (event.ctrlKey && event.code === "KeyS") {
    event.preventDefault();
  }
  if (event.code === "F10") {
    event.preventDefault();
  }
  if (event.code === "F12") {
    event.preventDefault();
  }
  if (event.ctrlKey && event.shiftKey && event.code === "KeyI") {
    event.preventDefault();
  }
});
document.addEventListener("contextmenu", function (event) {
  event.preventDefault();
});

function deleteSavedData() {
  if (confirm("Are you sure you want to delete all saved data?")) {
    localStorage.removeItem("taskOptions");
    localStorage.removeItem("outputTableData");
    location.reload();
  }
}

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "/") {
    deleteSavedData();
  }
});

function resetTableData() {
  if (confirm("Are you sure you want to reset the table data?")) {
    localStorage.removeItem("outputTableData");
    location.reload();
  }
}