const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");


module.exports.__init__ = function(){
    this.rpc_endpoints = new Map();
};


module.exports.register = function(method, handler){
    this.rpc_endpoints.set(method, handler);
    return this.join(method);
};


module.exports.unregister = function(method){
    this.rpc_endpoints.delete(method);
    return this.leave(method);
};


module.exports.call = async function call(topic, data){
    await this.join(topic);

    let referenced = $REF({ topic, data });
    let called_promise = this.new_promise_of_event(
        "topic.called", referenced.uuid());
    this.socket.emit($E("topic.call"), referenced.data());

    let invocation_id = null;
    try{
        let called_result = await called_promise;
        invocation_id = _.get(
            $DEREF(called_result).data(),
            "invocation"
        );
    } catch(e){
        throw e;
    }

    return this.new_promise_of_event("topic.result", invocation_id);
};


module.exports._on_topic_invoke = async function(request_data){
    let request = $DEREF(request_data);
    let { topic, data } = request.data() || {};
    if(!this.rpc_endpoints.has(topic)) return;

    try{
        let result = await this.rpc_endpoints.get(topic)(data);
        this.socket.emit(
            $E("topic.yield"),
            $REF({ topic, result }, request.uuid()).data()
        );
    } catch(e){
        this.socket.emit(
            $E("topic.yield"),
            $REF({ topic, error: e.message }, request.uuid()).data()
        );
    }
}
