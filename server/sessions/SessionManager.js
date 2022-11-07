const Session = require("./Session");
const _ = require("lodash");

class SessionManager {

    #sessions;
    constructor(){
        this.#sessions = new Map();
        setInterval(()=>this.clean_sessions(), 30000);
    }

    clean_sessions(){
        let ids = [];
        this.#sessions.forEach((session, session_id)=>{
            if(session.is_expired()) ids.push(session_id);
        });
        ids.forEach((id)=>this.#sessions.delete(id));
    }

    create_session(authorized_userid){
        const new_session = new Session(authorized_userid);
        const session_id = new_session.get_id();
        this.#sessions.set(session_id, new_session);
        return session_id;
    }

    reactivate_session(session_id, check_user_id){
        this.clean_sessions();
        if(this.#sessions.has(session_id)){
            return this.#sessions.get(session_id).reactivate(check_user_id);
        }
        return false;
    }

    get_session(session_id){
        if(!_.isString(session_id)) return null;
        return this.#sessions.get(session_id);
    }

    remove_session(session_id){
        this.#sessions.delete(session_id);
        return true;
    }

    remove_all_sessions(){
        this.#sessions.clear();
        return true;
    }

}

module.exports = SessionManager;
