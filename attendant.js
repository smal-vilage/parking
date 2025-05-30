carSection = "car-info-section";
userRole = "attendant";

function recordCarInfo() {
    const plateNumber = document.getElementById("plate-number").value;
    const plateType = document.getElementById("plate-type").value;
    const ownerMobile = document.getElementById("owner-mobile").value;

    if (!plateNumber || !plateType) {
        alert("Please fill in all car information fields.");
        return;
    }

    const enterTime = new Date();
    const userId = auth.currentUser.uid;

    db.collection("cars").add({
        userId,
        plateNumber,
        plateType,
        ownerMobile,
        enterTime,
        status: "Inside"
    }).then(docRef => {
        document.getElementById("plate-number").value = "";
        document.getElementById("plate-type").value = "";
        document.getElementById("owner-mobile").value = "";
        const qrCodeContainer = document.getElementById("qr-code");
        qrCodeContainer.innerHTML = "";

        domain = "https://parking.jorshacos.com"
        // domain = "http://127.0.0.1:5500"
        const baseUrl = domain + "/request.html"; 
        const qrText = `${baseUrl}?id=${encodeURIComponent(docRef.id)}`;

        new QRCode(qrCodeContainer, {
            text: qrText,
            width: 128,
            height: 128
        });

        // Fill receipt info
        document.getElementById("receipt-info").innerHTML = `
            <div><strong>Plate Number:</strong> ${plateNumber}</div>
            <div><strong>Plate Type:</strong> ${plateType}</div>
            <div><strong>Owner Mobile:</strong> ${ownerMobile}</div>
            <div><strong>Entry Time:</strong> ${enterTime.toLocaleString()}</div>
        `;
        console.log("qrUrl", qrText);

        window.lastReceiptData = {
            plateNumber,
            plateType,
            ownerMobile,
            enterTime: enterTime.toLocaleString(),
            qrUrl: qrText
        };
    });
}
