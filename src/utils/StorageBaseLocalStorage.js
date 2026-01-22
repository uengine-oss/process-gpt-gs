import StorageBase from "./StorageBase";

export default class StorageBaseLocalStorage extends StorageBase {
    getString(path) {
        return localStorage.getItem(path)
    }
    getObject(path) {
        return localStorage.getItem(path)
    }
    putString(path, value, options) {
        localStorage.setItem(path, value)
    }
    putObject(path, value, options) {
        localStorage.setItem(path, value)
    }
    pushString(path, value, options) {
        console.log('No methods : localStorage push')
    }
    pushObject(path, value, options) {
        console.log('No methods : localStorage push')
    }
    delete(path) {
        localStorage.removeItem(path)
    }
    watch(path, callback) {
        console.log('No methods : LocalStorage Watch')
    }

}