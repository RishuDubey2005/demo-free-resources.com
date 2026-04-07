const { google } = require('googleapis');
const { Readable } = require('stream');
const path = require('path');

// ── Single OAuth client for lost items (existing) ──
function createDriveClient(clientId, clientSecret, refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://demo-free-content-com.onrender.com');
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: 'v3', auth: oauth2Client });
}

class GoogleDriveService {
    constructor() {
        // Existing lost-items drive (untouched)
        this.lostDrive = createDriveClient(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REFRESH_TOKEN
        );
        this.lostItemFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        // Per-branch separate drives
        this.branchDrives = {
            EE: {
                drive: createDriveClient(
                    process.env.GOOGLE_CLIENT_ID_EE,
                    process.env.GOOGLE_CLIENT_SECRET_EE,
                    process.env.GOOGLE_REFRESH_TOKEN_EE
                ),
                folderId: process.env.GOOGLE_DRIVE_FOLDER_EE
            },
            ME: {
                drive: createDriveClient(
                    process.env.GOOGLE_CLIENT_ID_ME,
                    process.env.GOOGLE_CLIENT_SECRET_ME,
                    process.env.GOOGLE_REFRESH_TOKEN_ME
                ),
                folderId: process.env.GOOGLE_DRIVE_FOLDER_ME
            },
            CE: {
                drive: createDriveClient(
                    process.env.GOOGLE_CLIENT_ID_CE,
                    process.env.GOOGLE_CLIENT_SECRET_CE,
                    process.env.GOOGLE_REFRESH_TOKEN_CE
                ),
                folderId: process.env.GOOGLE_DRIVE_FOLDER_CE
            }
        };

        console.log("✅ Google Drive clients initialized (lost-items + EE + ME + CE)");
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

    // ── EXISTING: Lost item image upload (completely untouched) ──
    async uploadFile(buffer, originalName, mimeType) {
        const fileName = this.generateFileName(originalName);
        const response = await this.lostDrive.files.create({
            requestBody: {
                name: fileName,
                parents: [this.lostItemFolderId],
                mimeType
            },
            media: { mimeType, body: this.bufferToStream(buffer) },
            fields: "id"
        });
        const fileId = response.data.id;
        await this.lostDrive.permissions.create({
            fileId,
            requestBody: { role: "reader", type: "anyone" }
        });
        const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        return { fileId, url };
    }

    // ── NEW: Upload PDF to branch-specific drive ──
    async uploadResourcePDF(buffer, fileName, branch) {
        const branchConfig = this.branchDrives[branch];
        if (!branchConfig) throw new Error(`No Drive configured for branch: ${branch}`);

        const { drive, folderId } = branchConfig;

        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId],
                mimeType: 'application/pdf'
            },
            media: {
                mimeType: 'application/pdf',
                body: this.bufferToStream(buffer)
            },
            fields: "id"
        });

        const fileId = response.data.id;

        await drive.permissions.create({
            fileId,
            requestBody: { role: "reader", type: "anyone" }
        });

        return { fileId, fileName };
    }

    // ── NEW: Delete PDF from branch-specific drive ──
    async deleteFile(fileId, branch) {
        if (branch && this.branchDrives[branch]) {
            await this.branchDrives[branch].drive.files.delete({ fileId });
        } else {
            // fallback: try lost-items drive (shouldn't happen normally)
            await this.lostDrive.files.delete({ fileId });
        }
    }

    // ── NEW: Stream PDF via proxy (branch-specific drive) ──
    async getFileStream(fileId, branch) {
        const drive = branch && this.branchDrives[branch]
            ? this.branchDrives[branch].drive
            : this.lostDrive;

        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );
        return response.data;
    }
}

const service = new GoogleDriveService();

module.exports = {
    // Existing export (lost items) — untouched
    uploadFile: (buffer, name, mime) => service.uploadFile(buffer, name, mime),
    // Lost item image permanent delete
    moveFileToTrash: (fileId) => service.lostDrive.files.delete({ fileId }),
    // New exports (resources)
    uploadResourcePDF: (buffer, fileName, branch) => service.uploadResourcePDF(buffer, fileName, branch),
    deleteFile: (fileId, branch) => service.deleteFile(fileId, branch),
    getFileStream: (fileId, branch) => service.getFileStream(fileId, branch)
};
