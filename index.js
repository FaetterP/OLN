import { initializeApp } from "firebase/app";
import { readFileSync, readdirSync } from "fs";
import { getDatabase, ref, set } from "firebase/database";
import imageToBase64 from 'image-to-base64';

const SAVING_DEPTH = 4
// Глубина определяет, насколько сильно будут дробиться данные для загрузки
// Firebase не может сохранять большие объекты за один запрос

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

function isTextFile(string) {
    const types = [".txt", ".mcmeta", ".lang", ".json"]

    for (const type of types) {
        if (string.endsWith(type))
            return true
    }
    return false
}

function isImageFile(string) {
    const types = [".png"]

    for (const type of types) {
        if (string.endsWith(type))
            return true
    }
    return false
}

async function getContents(folder) {
    let contents = {}
    for (const dirent of readdirSync(folder, { withFileTypes: true })) {
        const direntPath = `${folder}/${dirent.name}`
        const firebaseName = dirent.name.replaceAll(".", ",")

        if (dirent.isDirectory()) {
            const content = await getContents(direntPath)
            contents[firebaseName] = {
                isFolder: true,
                keys: Object.keys(content),
                content
            };
        }
        else {
            if (isTextFile(direntPath)) {
                const content = readFileSync(direntPath, { encoding: 'utf-8' })
                contents[firebaseName] = content
            }
            else if (isImageFile(direntPath)) {
                const content = await imageToBase64(direntPath)
                contents[firebaseName] = content
            }
        }
    }
    return contents;
}

async function saveToFirebase(path, data, depth) {
    for (const key of Object.keys(data)) {
        if (depth > 0 && data[key].isFolder) {
            console.log("next", `${path}/${key}`)
            await set(ref(getDatabase(), `${path}/${key}/isFolder`), data[key].isFolder)
            await set(ref(getDatabase(), `${path}/${key}/keys`), data[key].keys)
            await saveToFirebase(`${path}/${key}/content`, data[key].content, depth - 1)
        }
        else {
            console.log(`${path}/${key}`)
            const dbRef = ref(getDatabase(), `${path}/${key}`);
            await set(dbRef, data[key])
        }
    }
}

(async () => {
    const content = await getContents("assets")
    const data = {
        better: {
            isFolder: true,
            keys: Object.keys(content),
            content
        }
    }
    await saveToFirebase(`OLN-assets`, data, SAVING_DEPTH)
    process.exit(0)
})()
