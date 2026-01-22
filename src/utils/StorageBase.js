// Strategy pattern.
// Factory Pattern.

export default class StorageBase {

   
    signIn(value) {
        throw new Error('signIn() must be implement')
    }
    signUp(value) {
        throw new Error('signUp() must be implement')
    }
    signOut(value) {
        throw new Error('signOut() must be implement')
    }
    getUserInfo() {
        throw new Error('getUserInfo() must be implement')
    }
    getString(path, options) {
        throw new Error('getString() must be implement')
    }
    getObject(path, options) {
        throw new Error('getObject() must be implement')
    }
    putString(path, value, options) {
        throw new Error('putString() must be implement')
    }
    putObject(path, value, options) {
        throw new Error('putObject() must be implement')
    }
    // pushString(path, value, options) {
    //     throw new Error('pushString() must be implement')
    // }
    // pushObject(path, value, options) {
    //     throw new Error('pushObject() must be implement')
    // }
    delete(path, options) {
        throw new Error('delete() must be implement')
    }

}