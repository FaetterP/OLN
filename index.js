import { initializeApp } from "firebase/app";
import fs from "fs";
import glob from "glob";
import path from "node:path";
import { getDatabase, ref, set } from "firebase/database";
import imageToBase64 from 'image-to-base64';

const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    databaseURL: process.env.databaseURL,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId
};

const app = initializeApp(firebaseConfig);

function getDirectories(src) {
    return new Promise((resolve, reject) => {
        const callback = (err, res) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(res)
            }
        }
        glob(src + '/**/*', callback);
    })
}

function isFolder(path) {
    try {
        fs.readdirSync(path);
        return true;
    } catch {
        return false;
    }
}

(async function () {
    const ret = {
        "assets": {
            isFolder: true,
            name: "assets",
            content: []
        }
    }
    const filePaths = await getDirectories("assets")
    for (const filePath of filePaths) {
        if (isFolder(filePath)) {
            let name = path.basename(filePath)

            ret[filePath.replaceAll('/', ' ').replaceAll('.', ',')] = {
                isFolder: true,
                name: path.basename(filePath),
                content: []
            }

            const dirname = path.dirname(filePath)
            ret[dirname.replaceAll('/', ' ').replaceAll('.', ',')].content.push(name)
        }
        else {
            let content = ""
            let name = path.basename(filePath)
            if (name.endsWith(".png")) {
                content = await imageToBase64(filePath)
            }
            else if (name.endsWith(".lang")) {
                content = fs.readFileSync(filePath).toString()
            }

            ret[filePath.replaceAll('/', ' ').replaceAll('.', ',')] = {
                isFolder: false,
                name,
                content
            }

            const dirname = path.dirname(filePath)
            ret[dirname.replaceAll('/', ' ').replaceAll('.', ',')].content.push(name)
        }
    }

    for (const key of Object.keys(ret)) {
        console.log(key)
        const dbRef = ref(getDatabase(), `OLN-assets/TechnoMagic/${key}/`);
        await set(dbRef, ret[key])
    }

    process.exit(0)
}());
