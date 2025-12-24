function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);
        var action = data.action;

        if (action === "upload_receipt") {
            return handleUpload(data);
        } else if (action === "send_email") {
            return handleEmail(data);
        } else {
            return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid action" })).setMimeType(ContentService.MimeType.JSON);
        }
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
}

function handleUpload(data) {
    var folderId = "YOUR_GOOGLE_DRIVE_FOLDER_ID"; // Replace with your Folder ID
    var folder = DriveApp.getFolderById(folderId);

    var contentType = data.mimeType || "image/jpeg";
    var blob = Utilities.newBlob(Utilities.base64Decode(data.filebase64), contentType, data.fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        fileUrl: file.getDownloadUrl(),
        fileId: file.getId()
    })).setMimeType(ContentService.MimeType.JSON);
}

function handleEmail(data) {
    // data = { to, subject, body }
    MailApp.sendEmail({
        to: data.to,
        subject: data.subject,
        htmlBody: data.body
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}
