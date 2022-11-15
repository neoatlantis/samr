const _ = require("lodash");
const events = require('events');
const { $E, $ERR, $REF, $DEREF } = require("../protodef");

const PERIOD = 5000;
const CONNECTION_TIMEOUT = 15000;


class StatusMonitor extends events.EventEmitter {

    #started = false;

    #last_update = new Date(0);
    #session_id = null;

    connected = false;
    authenticated = false;

    constructor(client){
        super();

        this.client = client;
        this.#trigger();
    }

    #trigger(){
        try{
            if(this.#started){
                this.client.socket.emit("sys.user.status");
            }
        } catch(e){
            console.error(e);
        } finally {
            setTimeout(()=>this.#trigger(), PERIOD);
            this.#recalculate();
        }

    }

    #recalculate(){
        let last_update_timestamp = this.#last_update.getTime();
        if(!_.isNumber(last_update_timestamp)){
            last_update_timestamp = 0;
        }

        this.connected = (
            Math.abs(new Date().getTime() - last_update_timestamp)
            < CONNECTION_TIMEOUT
        );
        this.authenticated = this.connected && !_.isNil(this.#session_id);
        this.emit("updated");
    }

    on_status(update){
        update = $DEREF(update).data();

        this.#last_update = new Date(_.get(update, "time", 0));
        this.#session_id = _.get(update, "session_id");
    }

    start(){
        this.#started = true;
    }


}

module.exports = StatusMonitor;
