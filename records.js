let pageSize = 10;
let lastVisible = null;
let firstVisible = null;
let currentPage = 1;
let pageStack = []; // For going back
let totalItems = 0;
let totalPages = 1;
let unsubscribe = null; // Add this at the top to manage listeners

function renderPaginationControls(itemsOnPage) {
    const container = document.getElementById("pagination-controls");
    container.innerHTML = `
        <button class="btn btn-outline-secondary btn-sm" id="prev-page" ${currentPage === 1 ? "disabled" : ""}>Prev</button>
        <span class="input-group-text">Page ${currentPage} of ${totalPages}</span>
        <button class="btn btn-outline-secondary btn-sm" id="next-page" ${(itemsOnPage < pageSize || currentPage === totalPages) ? "disabled" : ""}>Next</button>
    `;
    document.getElementById("prev-page").onclick = prevPage;
    document.getElementById("next-page").onclick = nextPage;
}

function filterCars(direction = "current") {
    const statusFilter = document.getElementById("status-filter").value;
    const plateFilter = document.getElementById("plate-filter").value.trim().toLowerCase();
    const from = document.getElementById("from-filter").value;
    const to = document.getElementById("to-filter").value;
    let query = db.collection("cars");
    let dateField = null;
    if (statusFilter === "Exited") dateField = "exitTime";
    else if (statusFilter === "Inside") dateField = "enterTime";
    else if (statusFilter === "Requested") dateField = "requestTime";
    else if (statusFilter === "Paid") dateField = "paidTime";

    let useDateQuery = false;
    if (statusFilter !== "All") query = query.where("status", "==", statusFilter);
    if (dateField && from) {
        const fromDate = new Date(from);
        query = query.where(dateField, ">=", new Date(fromDate.setHours(0,0,0,0)));
        useDateQuery = true;
    }
    if (dateField && to) {
        const toDate = new Date(to);
        toDate.setHours(23,59,59,999);
        query = query.where(dateField, "<=", toDate);
        useDateQuery = true;
    }
    if (useDateQuery && dateField) {
        query = query.orderBy(dateField, "desc");
    } else {
        query = query.orderBy("enterTime", "desc");
    }

    // 1. Count total items (one-time)
    query.get().then(allSnapshot => {
        let allDocs = [];
        allSnapshot.forEach(doc => {
            const data = doc.data();
            let matches = true;
            if (plateFilter && (!data.plateNumber || !data.plateNumber.toLowerCase().includes(plateFilter))) {
                matches = false;
            }
            if (matches) allDocs.push(doc);
        });
        totalItems = allDocs.length;
        totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

        // 2. Setup paged query for current page (real-time)
        let pagedQuery = db.collection("cars");
        if (statusFilter !== "All") pagedQuery = pagedQuery.where("status", "==", statusFilter);
        if (dateField && from) {
            const fromDate = new Date(from);
            pagedQuery = pagedQuery.where(dateField, ">=", new Date(fromDate.setHours(0,0,0,0)));
        }
        if (dateField && to) {
            const toDate = new Date(to);
            toDate.setHours(23,59,59,999);
            pagedQuery = pagedQuery.where(dateField, "<=", toDate);
        }
        if (useDateQuery && dateField) {
            pagedQuery = pagedQuery.orderBy(dateField, "desc").limit(pageSize);
        } else {
            pagedQuery = pagedQuery.orderBy("enterTime", "desc").limit(pageSize);
        }
        if (direction === "next" && lastVisible) {
            pagedQuery = pagedQuery.startAfter(lastVisible);
        } else if (direction === "prev" && pageStack.length > 1) {
            const prev = pageStack[pageStack.length - 2];
            pagedQuery = pagedQuery.startAt(prev);
        }

        // Remove previous listener if any
        if (unsubscribe) unsubscribe();

        // 3. Real-time listener for current page
        unsubscribe = pagedQuery.onSnapshot(snapshot => {
            const carList = document.getElementById("car-list");
            carList.innerHTML = "";
            let docs = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                let matches = true;
                if (plateFilter && (!data.plateNumber || !data.plateNumber.toLowerCase().includes(plateFilter))) {
                    matches = false;
                }
                if (matches) {
                    carList.innerHTML += window.renderCarCard(data);
                    if (data.status === "Requested" && userRole === "monitor") {
                        showNotification(`Car ${data.plateNumber} requested!`);
                    }
                    docs.push(doc);
                }
            });

            if (docs.length > 0) {
                firstVisible = docs[0];
                lastVisible = docs[docs.length - 1];
                if (direction === "next") {
                    pageStack.push(firstVisible);
                    currentPage++;
                } else if (direction === "prev" && currentPage > 1) {
                    pageStack.pop();
                    currentPage--;
                } else if (direction === "current") {
                    pageStack = [firstVisible];
                    currentPage = 1;
                }
            }
            renderPaginationControls(docs.length);
        });
    });
}

function nextPage() {
    filterCars("next");
}
function prevPage() {
    if (currentPage > 1) {
        filterCars("prev");
    }
}