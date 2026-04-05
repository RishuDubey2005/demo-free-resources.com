const { google } = require('googleapis');
const { Readable } = require('stream');
const path = require('path');

class GoogleDriveService {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'http://localhost:3000'
        );

        this.oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        this.drive = google.drive({
            version: 'v3',
            auth: this.oauth2Client
        });

        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        console.log("✅ Google Drive OAuth initialized");
    }

    bufferToStream(buffer) {
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        return stream;
    }

    generateFileName(originalName) {
        const ext = originalName ? path.extname(originalName) : ".jpg";
        return `lost_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    }

    async uploadFile(buffer, originalName, mimeType) {
        const fileName = this.generateFileName(originalName);

        const response = await this.drive.files.create({
            requestBody: {
                name: fileName,
                parents: [this.folderId],
                mimeType
            },
            media: {
                mimeType,
                body: this.bufferToStream(buffer)
            },
            fields: "id"
        });

        const fileId = response.data.id;

        // Make public
        await this.drive.permissions.create({
            fileId,
            requestBody: {
                role: "reader",
                type: "anyone"
            }
        });

        const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

        return { fileId, url };
    }
}

const service = new GoogleDriveService();

module.exports = {
    uploadFile: (buffer, name, mime) =>
        service.uploadFile(buffer, name, mime)
};