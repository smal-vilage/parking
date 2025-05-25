carSection = "car-status-section";
userRole = "accountant";

function updateCar(docId, newStatus) {
    db.collection("cars").doc(docId).update({
        status: newStatus,
        ...(newStatus === "Paid" && { paidTime: new Date() })
    }).then(() => {
        filterCars();
    }).catch(error => {
        alert("Failed to update car status: " + error.message);
    });
}