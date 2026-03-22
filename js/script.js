import { database } from "./config.js";
import { ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const committees = {
  HR: ["Sanaa Mohamed", "Ahmed Maher", "Alaa 3laa", "Menna Ahmed", "Ziad Ashraf"],
  PR: ["Manar Feid", "Nabil Mohamed", "Malak Gamal", "Marwan Alaa", "Omar Ahmed"],
  Media: ["Hossam Ahmed", "Mariam Ibrahim", "Soha Mohamed", "Salma Wael"],
  Logistics: ["Eman Hashem", "Merna Mohamed", "Mohamed Ali", "Mahmoud Elrawy"],
  Technical: ["Amr Mossalem", "Mazen Elwany", "Mostafa Ayman", "Ziad Assem", "Sara Yasser", "Hams Mohamed"]
};

const committeeSelect = document.getElementById("committee");
const membersListDiv = document.getElementById("membersList");
const saveBtn = document.getElementById("saveBtn");
const summaryTableContainer = document.getElementById("summaryTableContainer");
const toggleSummary = document.getElementById("toggleSummary");
const summaryHeader = toggleSummary.parentElement;

// Login Modal
const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const closeModal = document.querySelector(".close");
const ADMIN_USERNAME = "FavCommittee";
const ADMIN_PASSWORD = "HR Eltop";

// Session Button
const sessionBtn = document.getElementById("sessionBtn");
let sessionActive = false;
let pendingAction = null;

const editModal = document.getElementById("editModal");
const closeEdit = document.querySelector(".close-edit");
const editMeetingDate = document.getElementById("editMeetingDate");
const editNotes = document.getElementById("editNotes");
const editMembersList = document.getElementById("editMembersList");
const saveEditBtn = document.getElementById("saveEditBtn");
const discardEditBtn = document.getElementById("discardEditBtn");

// Member Points Elements
const pointsTableContainer = document.getElementById("pointsTableContainer");
const togglePoints = document.getElementById("togglePoints");

let currentEditIndex = null;
let meetingsData = [];

// ----------------- Firebase Load -----------------
const meetingsRef = ref(database, "meetings");

onValue(meetingsRef, (snapshot) => {
  const data = snapshot.val();
  meetingsData = data ? data : [];
  renderSummary();
  renderMemberPoints();
});

// ----------------- Render Members -----------------
function renderMembers() {
  const selectedCommittee = committeeSelect.value;
  membersListDiv.innerHTML = "";
  if(!selectedCommittee) return;

  committees[selectedCommittee].forEach(member => {
    const div = document.createElement("div");
    div.classList.add("member-checkbox");

    div.innerHTML = `
      <label>${member}</label>
      <select id="status-${member}">
        <option value="" hidden> Select Status </option>
        <option value="green">Attend</option>
        <option value="blue">Permission</option>
        <option value="red">Absent</option>
      </select>
    `;

    membersListDiv.appendChild(div);
  });
}

committeeSelect.addEventListener("change", renderMembers);

// ----------------- Save Data (Firebase) -----------------
function saveData() {
  set(meetingsRef, meetingsData);
}

// ----------------- Toggle Summary -----------------
function toggleSummarySection() {
  if(summaryTableContainer.style.display === "none" || summaryTableContainer.style.display === "") {
    summaryTableContainer.style.display = "block";
    toggleSummary.classList.add("open");
  } else {
    summaryTableContainer.style.display = "none";
    toggleSummary.classList.remove("open");
  }
}

summaryHeader.addEventListener("click", toggleSummarySection);

summaryTableContainer.style.display = "none";
toggleSummary.classList.remove("open");

// ----------------- Session Button -----------------
sessionBtn.addEventListener("click", () => {
  if(!sessionActive){
    loginModal.style.display = "block";
    pendingAction = () => {
      sessionActive = true;
      sessionBtn.classList.add("active");
      sessionBtn.title = "Logged in";
      alert("Session activated! You can now edit/add/delete meetings and points.");
    };
  }
});

// Login modal close
closeModal.addEventListener("click", () => loginModal.style.display = "none");
window.addEventListener("click", e => { if(e.target === loginModal) loginModal.style.display = "none"; });

// ----------------- Login Check -----------------
loginBtn.addEventListener("click", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if(username === ADMIN_USERNAME && password === ADMIN_PASSWORD){
    loginModal.style.display = "none";
    usernameInput.value = "";
    passwordInput.value = "";
    if(pendingAction) pendingAction();
    pendingAction = null;
  } else {
    alert("Invalid credentials! Action denied.");
  }
});

// إنهاء الجلسة عند غلق الـ tab
window.addEventListener("beforeunload", () => {
  sessionActive = false;
  sessionBtn.classList.remove("active");
  sessionBtn.title = "Click to login";
});

// ----------------- Save Meeting -----------------
saveBtn.addEventListener("click", () => {
  if(!sessionActive){
    alert("You must login first!");
    return;
  }
  saveMeetingConfirmed();
});

function saveMeetingConfirmed() {
  const selectedCommittee = committeeSelect.value;
  const dateInput = document.getElementById("meetingDate").value;
  const notes = document.getElementById("notes").value.trim();

  if(!selectedCommittee){
    alert("Please select a committee.");
    return;
  }

  if(!dateInput){
    alert("Please select a meeting date.");
    return;
  }

  const meetingDate = new Date(dateInput);
  const today = new Date();
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 30);

  if(meetingDate < twoDaysAgo || meetingDate > today){
    alert("Meeting date must be within the last 2 days.");
    return;
  }

  const lines = notes.split(/\r?\n/).filter(line => line.trim() !== "");
  if(lines.length < 4){
    alert("Notes must have at least 4 lines.");
    return;
  }

  try {
    const members = committees[selectedCommittee].map(member => {
      const statusSelect = document.getElementById(`status-${member}`);
      if(!statusSelect.value){
        throw alert(`Please select a status for ${member}`);
      }
      return { name: member, status: statusSelect.value };
    });

    const newMeeting = {
      committee: selectedCommittee,
      date: dateInput,
      notes,
      members
    };

    meetingsData.push(newMeeting);
    saveData();
    updateMemberPoints(newMeeting);

  } catch(err){
    return;
  }

  committeeSelect.value = "";
  document.getElementById("meetingDate").value = "";
  document.getElementById("notes").value = "";
  membersListDiv.innerHTML = "";

  renderSummary();
  alert("Meeting saved successfully!");
}

// ----------------- Render Summary -----------------
function renderSummary() {
  let html = "";

  Object.keys(committees).forEach(cmt => {
    html += `<h3 style="color: #ffcc66;"> ● ${cmt} Committee</h3>`;
    html += `<div class="summary-table-container"><table class="summary-table">
      <tr>
        <th style="width:50px;">#</th>
        <th style="width:120px;">Date</th>
        <th style="width:300px;">Members Attendance</th>
        <th style="width:400px;">Notes</th>
        <th style="width:120px;">Actions</th>
      </tr>`;

    const committeeMeetings = meetingsData.filter(d => d.committee === cmt);

    if(committeeMeetings.length === 0){
      html += `<tr>
      <td colspan="5" style="text-align:left;">No meetings recorded yet.</td>
      </tr>`;
    } else {
      committeeMeetings.forEach((meeting, index) => {
        const membersStatus = meeting.members.map(m => 
          `<span class="attendance-box ${m.status}" style="margin:3px;">${m.name}</span>`
        ).join(" ");
        html += `<tr>
          <td>${index + 1}</td>
          <td>${meeting.date}</td>
          <td style="text-align:left; word-break:break-word;">${membersStatus}</td>
          <td class="notes" style="text-align:left; word-break:break-word;">${meeting.notes.replace(/\n/g,"<br>")}</td>
          <td>
            <button class="editBtn" data-index="${meetingsData.indexOf(meeting)}">Edit</button>
            <button class="deleteBtn" data-index="${meetingsData.indexOf(meeting)}">Delete</button>
          </td>
        </tr>`;
      });
    }

    html += `</table></div>`;
  });

  summaryTableContainer.innerHTML = html;

  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      if(!sessionActive){
        alert("You must login first!");
        return;
      }
      openEditModal(e.target.dataset.index);
    });
  });

  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      if(!sessionActive){
        alert("You must login first!");
        return;
      }
      const idx = e.target.dataset.index;
      if(confirm("Are you sure you want to delete this meeting?")){
        const deletedMeeting = meetingsData.splice(idx,1)[0];
        saveData();
        deletedMeeting.members.forEach(m=>{
          adjustMemberPoints(deletedMeeting.committee, m.name, m.status==="green"?-10:m.status==="blue"?-3:-(-5));
        });
        renderSummary();
        renderMemberPoints();
        alert("Meeting deleted successfully!");
      }
    });
  });
}

// ----------------- Edit Modal -----------------
function openEditModal(index){
  currentEditIndex = index;
  const meeting = meetingsData[index];

  editMeetingDate.value = meeting.date;
  editNotes.value = meeting.notes;
  editMembersList.innerHTML = "";
  document.getElementById("editCommittee").value = meeting.committee;

  meeting.members.forEach(m => {
    const div = document.createElement("div");
    div.classList.add("member-checkbox");
    div.innerHTML = `
      <label>${m.name}</label>
      <select id="edit-${m.name}">
        <option value="green" ${m.status==="green"?"selected":""}>Attend</option>
        <option value="blue" ${m.status==="blue"?"selected":""}>Permission</option>
        <option value="red" ${m.status==="red"?"selected":""}>Absent</option>
      </select>
    `;
    editMembersList.appendChild(div);
  });

  editModal.style.display = "block";
  document.body.classList.add("modal-open");
}

closeEdit.addEventListener("click", ()=>{ editModal.style.display="none"; document.body.classList.remove("modal-open"); });
discardEditBtn.addEventListener("click", ()=>{ editModal.style.display="none"; document.body.classList.remove("modal-open"); });

saveEditBtn.addEventListener("click", ()=>{
  if(!sessionActive){
    alert("You must login first!");
    return;
  }
  const meeting = meetingsData[currentEditIndex];
  meeting.date = editMeetingDate.value;
  meeting.notes = editNotes.value.trim();

  meeting.members.forEach(m=>{
    const status = document.getElementById(`edit-${m.name}`).value;
    m.status = status;
  });

  saveData();
  renderSummary();
  renderMemberPoints();
  editModal.style.display="none";
  document.body.classList.remove("modal-open");
});

// ----------------- Member Points System -----------------
togglePoints.parentElement.addEventListener("click", () => {
  if(pointsTableContainer.style.display === "none" || pointsTableContainer.style.display === ""){
    pointsTableContainer.style.display = "block";
  } else {
    pointsTableContainer.style.display = "none";
  }
});

function updateMemberPoints(meeting){
  const pointsRef = ref(database, "memberPoints/" + meeting.committee);
  get(pointsRef).then(snapshot => {
    const currentPoints = snapshot.val() || {};
    meeting.members.forEach(m => {
      let delta = 0;
      if(m.status === "green") delta = 10;
      else if(m.status === "blue") delta = 3;
      else if(m.status === "red") delta = -5;

      currentPoints[m.name] = { points: (currentPoints[m.name]?.points || 0) + delta };
    });
    set(pointsRef, currentPoints);
    renderMemberPoints();
  });
}

function renderMemberPoints(){
  const pointsRef = ref(database, "memberPoints");
  get(pointsRef).then(snapshot => {
    const data = snapshot.val() || {};
    let html = "";

    Object.keys(data).forEach(cmt => {
      html += `<h3 style="color: #ffcc66;"> ● ${cmt} Committee</h3>`;
      html += `<table>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Committee</th>
                  <th>Adjust Points</th>
                  <th>Total Points</th>
                </tr>`;

      const members = Object.entries(data[cmt])
        .map(([name, info]) => ({name, points: info.points, committee: cmt}))
        .sort((a,b) => b.points - a.points);

      members.forEach((m, idx) => {
        html += `<tr>
                  <td>${idx+1}</td>
                  <td>${m.name}</td>
                  <td>${m.committee}</td>
                  <td>
                    <button class="ptBtn" data-name="${m.name}" data-committee="${cmt}" data-points="5">+5</button>
                    <button class="ptBtn" data-name="${m.name}" data-committee="${cmt}" data-points="-5">-5</button>
                    <input type="number" placeholder="Custom" class="customPtInput" data-name="${m.name}" data-committee="${cmt}" style="width:60px;"/>
                    <button class="customPtBtn" data-name="${m.name}" data-committee="${cmt}">Add</button>
                  </td>
                  <td>${m.points}</td>
                </tr>`;
      });

      html += `</table>`;
    });

    pointsTableContainer.innerHTML = html;

    document.querySelectorAll(".ptBtn").forEach(btn => {
      btn.addEventListener("click", e => {
        if(!sessionActive){
          alert("You must login first!");
          return;
        }
        adjustMemberPoints(
          e.target.dataset.committee,
          e.target.dataset.name,
          parseInt(e.target.dataset.points)
        );
      });
    });

    document.querySelectorAll(".customPtBtn").forEach(btn=>{
      btn.addEventListener("click", e=>{
        if(!sessionActive){
          alert("You must login first!");
          return;
        }
        const input = e.target.previousElementSibling;
        const val = parseInt(input.value);
        if(!val) return alert("Enter a valid number");
        adjustMemberPoints(
          e.target.dataset.committee,
          e.target.dataset.name,
          val
        );
      });
    });
  });
}

function adjustMemberPoints(committee, name, delta){
  const memberRef = ref(database, "memberPoints/" + committee + "/" + name);
  get(memberRef).then(snapshot => {
    const current = snapshot.val() || {points:0};
    set(memberRef, { points: current.points + delta });
    renderMemberPoints();
  });
}
