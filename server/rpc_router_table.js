
class RPCRouterTable {

    #data;

    constructor(){
        this.#data = new Map();

        this.#cleaner();
    }

    add_record({ uuid, sender, receiver, data }){
        let time = new Date().getTime();
        this.#data.set(uuid, { sender, receiver, data, time });
    }

    get_record({ uuid }){
        return this.#data.get(uuid);
    }

    delete_record({ uuid }){
        return this.#data.delete(uuid);
    }

    #cleaner(){
        const clean_task = ()=>{
            const now = new Date().getTime();
            let ids = [];
            this.#data.forEach(({ time }, uuid)=>{
                if(now - time > 60000){
                    ids.push(uuid);
                }
            });
            ids.forEach((uuid)=>{
                this.#data.delete(uuid);
            });
        }
        setInterval(clean_task, 10000); // every 10 seconds
    }



}

module.exports = new RPCRouterTable();
