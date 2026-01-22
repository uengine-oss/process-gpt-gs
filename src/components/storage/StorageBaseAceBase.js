import StorageBaseAceBase_ from "./StorageBaseAceBase_";

export default class StorageBaseAceBase extends StorageBaseAceBase_ {
    constructor(client) {
        super(client);
    }

    async put(path, string, isString){
        var me = this

        try {
            //putObject
            var parseString = string
            if (!isString) {
                parseString = JSON.parse(parseString)
            }

            var reference = window.$acebase.ref(path)
            var snapshots = await me._put(reference,parseString)

            return snapshots ? snapshots : false
        } catch (e) {
            //putString
            var reference = window.$acebase.ref(path)
            var snapshots = await me._put(reference,string)

            return snapshots ? snapshots : false
        }
    }

    async set(path,string,isString){
        var me = this

        try {
            //setObject
            var parseString = string
            if (!isString) {
                parseString = JSON.parse(parseString)
            }

            var reference = window.$acebase.ref(path)
            var snapshots = await me._set(reference,parseString)

            return snapshots ? snapshots : false

        } catch (e) {
            //SetString
            var reference = window.$acebase.ref(path)
            var snapshots = await me._set(reference,string)

            return snapshots ? snapshots : false
        }
    }

    async push(path, string, isString){
        var me = this

        try {
            //pushObject
            var parseString = string
            if (!isString) {
                parseString = JSON.parse(parseString)
            }

            var reference = window.$acebase.ref(path)
            // var snapshots = await me._push(reference,parseString)

            // push Key 미리 생성후 삽입
            const snapshots = await me._push(reference)
            parseString.key = snapshots.key
            var pushPath = `${reference.path}/${snapshots.key}`
            reference = window.$acebase.ref(pushPath)
            await me._set(reference,parseString)


            return snapshots ? snapshots.key : null
        } catch (e) {
            //pushString
            var reference = window.$acebase.ref(path)
            var snapshots = await me._push(reference,string)
            return snapshots ? snapshots.key : null
        }
    }

    async get(path){
        var me = this
        var reference = window.$acebase.ref(path);
        var snapshots = await me._get(reference)

        return snapshots ? snapshots.val() : null
    }

    async list(path, metadata){
        var me = this


        var reference = window.$acebase.ref(path)

        if(metadata){
            reference = reference.query(reference.db)

            var orderByKey = metadata.orderBy ? metadata.orderBy : 'timeStamp'

            // SORT
            if (metadata.sort && metadata.sort.includes('desc')) {
                reference = reference.sort(orderByKey, false)
            }else{
                reference = reference.sort(orderByKey)
            }

            // RANGE
            if (me.isEqualTo(metadata.startAt, metadata.endAt)){
                reference = reference.filter(orderByKey, '==', metadata.startAt)
            } else if( metadata.startAt && !metadata.endAt ){
                // Start ~
                reference = reference.filter(orderByKey, '>=', metadata.startAt)
            } else if( !metadata.startAt && metadata.endAt ){
                // ~ END
                reference = reference.filter(orderByKey, '<=', metadata.endAt)
            } else if( metadata.startAt && metadata.endAt ){
                // Start ~ END
                reference = reference.filter(orderByKey, '<=', metadata.endAt)
                reference = reference.filter(orderByKey, '>=', metadata.startAt)
            }

            // SIZE && DIRECTION
            if (metadata.size) {
                reference = reference.take(metadata.size)
            }
        }

        var snapshots = await me._list(reference)

        if( snapshots && metadata ){
            return me.forwardChildren(snapshots)
        }else{
            return Array.isArray(snapshots) && snapshots.length > 0
                ? me.forwardChildren(snapshots)
                : (Object.keys(snapshots).length > 0 ? snapshots.val() : null )
        }
    }

    isValidatePath(path){
        var me = this
        try{
            var reference = window.$acebase.ref(path);
            return {status : true, msg: null}
        }catch(e){
            return {status : false, msg: e.message }
        }
        // ".", "#", "$", "[", or "]"
    }

    watch(path, callback){
        var me = this
        var reference = window.$acebase.ref(path)

        me._watch(reference, function (snapshot){
            if (snapshot) {
                if( Object.keys(snapshot.context()).length == 0){
                    var snapshotObj = snapshot.val()
                    callback(snapshotObj.value)
                }else{
                    callback(snapshot.val())
                }
            }else{
                callback(null)
            }
        })
    }

    watch_added(path, option, callback){
        var me = this

        try{
            var reference = window.$acebase.ref(path)

            if(option){
                // option all null check
                if (option.orderBy) {
                    if (option.sort && option.sort.includes('desc')) {
                        reference = reference.sort(option.orderBy, false)
                    }else{
                        reference = reference.sort(option.orderBy, true)
                    }
                }

                // if (option.size) {
                //     if (option.sort && option.sort.includes('desc')) {
                //         reference = reference.limitToLast(option.size)
                //     } else {
                //         reference = reference.limitToFirst(option.size)
                //     }
                // }

                // RANGE
                var filterKey = option.orderBy ? option.orderBy : null

                if(filterKey){
                    if (me.isEqualTo(option.startAt, option.endAt)){
                        reference = reference.filter(filterKey, '==', option.startAt)
                    } else if( option.startAt && !option.endAt ){
                        // Start ~
                        reference = reference.filter(filterKey, '>=', option.startAt)
                    } else if( !option.startAt && option.endAt ){
                        // ~ END
                        reference = reference.filter(filterKey, '<=', option.endAt)
                    } else if( option.startAt && option.endAt ){
                        // Start ~ END
                        reference = reference.filter(filterKey, '>=', option.startAt)
                        reference = reference.filter(filterKey, '<=', option.endAt)
                    }
                }
            }

            me._watch_added( reference, option, function (snapshot) {
                if (snapshot && snapshot.exists()) {
                    var queue = snapshot.val()

                    if (typeof queue == 'boolean') {
                        var obj = {
                            key: queue.key,
                            value: queue
                        }
                        callback(obj)
                    } else if(typeof queue == 'string'){
                        var obj = {
                            key: snapshot.key,
                            value: queue
                        }
                        callback(obj)
                    } else {
                        queue.key = snapshot.key
                        callback(queue)
                    }
                } else {
                    callback(null)
                }
            })
        }catch (e) {
            console.log(e)
        }
    }

    watch_off(path){
        var me = this
        var reference = window.$acebase.ref(path);
        return this._watch_off(reference)
    }

    delete(path){
        var me = this
        
        var reference = window.$acebase.ref(path);
        return this._delete(reference)
    }

    isConnection(path,callback){
        var me = this
        // 'disconnected'|'connecting'|'connected'|'disconnecting';
        if(window.$acebase.connectionState == 'connecting' ||  window.$acebase.connectionState == 'connected'){
            callback(true)
        }else{
            callback(false)
        }
    }

    /////////// Function ///////////
    forwardChildren(snapshot) {
        var children = [];
        if(snapshot.length > 0){
            snapshot.forEach(function (child) {
                if(child.key != "count"){
                    var val = child.val()
                    val.key = child.key
                    children.push(val);
                }
            });
            return children;
        }
       return null;
    }

    reversedChildren(snapshot) {
        var children = [];
        if(snapshot.length > 0){
            snapshot.forEach(function (child) {
                if(child.key != "count"){
                    var val = child.val()
                    val.key = child.key
                    children.unshift(val);
                }
            });
            return children;
        }
        return null;
    }

    isEqualTo(a, b){
        try{
            if(a && b){
                return String(a).toLowerCase() == String(b).toLowerCase()
            }
            return false
        }catch (e) {
            return false
        }
    }
}