const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");
const events = require("events");

module.exports.__init__ = function(){
    this.topics = new events.EventEmitter();
};


module.exports.publish = function (topic, data){
    let referenced = $REF({ topic, data });
    let ret = this.new_promise_of_event(
        "topic.published", referenced.uuid());
    this.socket.emit($E("topic.publish"), referenced.data());
    return ret;
};


module.exports._on_topic_event = async function on_topic_event(request_data){
    let request = $DEREF(request_data);
    let { topic, data } = (request.data() || {});

    this.topics.emit(topic, data, request.uuid());
};
