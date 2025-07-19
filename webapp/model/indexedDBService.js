sap.ui.define([], function () {
    "use strict";

    var DB_NAME = "XcaretRecepArtDB";
    var DB_VERSION = 1;

    var STORE_NAMES = {
        scheduleLine: "ScheduleLine",
        scheduleLineDetail: "ScheduleLineDetail", // Para los detalles de cada registro principal
        contract: "Contract",
        user: "User",
        projects: "Projects",
        images: "Images",
        signatures: "Signatures",
        pendingOps: "PendingOps"
    };

    var dbInstance = null;

    function openDB() {
        return new Promise(function (resolve, reject) {
            if (dbInstance) return resolve(dbInstance);
            var request = window.indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function (event) {
                var db = event.target.result;
                Object.keys(STORE_NAMES).forEach(function (key) {
                    var store = STORE_NAMES[key];
                    if (!db.objectStoreNames.contains(store)) {
                        db.createObjectStore(store, { keyPath: "id", autoIncrement: false });
                    }
                });
            };
            request.onsuccess = function (event) {
                dbInstance = event.target.result;
                resolve(dbInstance);
            };
            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    }

    function saveData(store, data) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(store, "readwrite");
                var objStore = tx.objectStore(store);
                objStore.put(data);
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function (e) { reject(e.target.error); };
            });
        });
    }

    function saveBulk(store, dataArr) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(store, "readwrite");
                var objStore = tx.objectStore(store);
                dataArr.forEach(function (data) {
                    objStore.put(data);
                });
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function (e) { reject(e.target.error); };
            });
        });
    }

    function getAll(store) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(store, "readonly");
                var objStore = tx.objectStore(store);
                var req = objStore.getAll();
                req.onsuccess = function () { resolve(req.result); };
                req.onerror = function (e) { reject(e.target.error); };
            });
        });
    }

    function getById(store, id) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(store, "readonly");
                var objStore = tx.objectStore(store);
                var req = objStore.get(id);
                req.onsuccess = function () { resolve(req.result); };
                req.onerror = function (e) { reject(e.target.error); };
            });
        });
    }

    function deleteById(store, id) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(store, "readwrite");
                var objStore = tx.objectStore(store);
                var req = objStore.delete(id);
                req.onsuccess = function () { resolve(); };
                req.onerror = function (e) { reject(e.target.error); };
            });
        });
    }

    function clearStore(store) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(store, "readwrite");
                var objStore = tx.objectStore(store);
                var req = objStore.clear();
                req.onsuccess = function () { resolve(); };
                req.onerror = function (e) { reject(e.target.error); };
            });
        });
    }

    function isOnline() {
        return window.navigator.onLine;
    }

    function addPendingOp(op) {
        return saveData(STORE_NAMES.pendingOps, op);
    }

    function getPendingOps() {
        return getAll(STORE_NAMES.pendingOps);
    }

    function deletePendingOp(id) {
        return deleteById(STORE_NAMES.pendingOps, id);
    }

    function syncPendingOps(processFn) {
        window.addEventListener("online", async function () {
            var ops = await getPendingOps();
            for (var i = 0; i < ops.length; i++) {
                await processFn(ops[i]);
                await deletePendingOp(ops[i].id);
            }
        });
    }

    function saveDetailDoc(EBELN, data) {
        return saveData(STORE_NAMES.scheduleLineDetail, {
            id: EBELN,
            ...data
        });
    }

    function getDetailDoc(EBELN) {
        return getById(STORE_NAMES.scheduleLineDetail, EBELN);
    }

    // Exporta las funciones del servicio
    return {
        DB_NAME: DB_NAME,
        DB_VERSION: DB_VERSION,
        STORE_NAMES: STORE_NAMES,
        openDB: openDB,
        saveData: saveData,
        saveBulk: saveBulk,
        getAll: getAll,
        getById: getById,
        deleteById: deleteById,
        clearStore: clearStore,
        isOnline: isOnline,
        addPendingOp: addPendingOp,
        getPendingOps: getPendingOps,
        deletePendingOp: deletePendingOp,
        syncPendingOps: syncPendingOps,
        saveDetailDoc,
        getDetailDoc
    };
});