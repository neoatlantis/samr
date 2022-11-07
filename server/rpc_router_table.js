
class RPCRouterTable {

    #data;

    constructor(){
        this.#data = new Map();

        this.#cleaner();
    }

    add_record({ uuid, sender, receiver, data }){
        let time = new Date();
        this.#data.set(uuid, { sender, receiver, data, time });
    }

    get_record({ uuid }){
        return this.#data.get(uuid);
    }

    delete_record({ uuid }){
        return this.#data.delete(uuid);
    }

    #cleaner(){
        function clean_task(){

        }
        setInterval(clean_task, 10000); // every 10 seconds
    }



}

module.exports = new RPCRouterTable();
