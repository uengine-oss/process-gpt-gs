import StorageBaseSupabase from "./StorageBaseSupabase";


export default class StorageBaseFactory {

    static getStorage() {
        // Factory Pattern.
        return new StorageBaseSupabase();
    }
}