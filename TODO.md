## Features for SAMR

Features for SAMR are mostly designed in borrow of the WAMP protocol, but is
non-compatible in protocol format. Both pub/sub and routed RPC should be
implemented.


1. SAMR communications must be encrypted. Self-signed certs are allowed.

2. Upon first login, the client must authenticate itself. After authentication,
   the client is granted a session id. The client MUST have a session id
   before it can use other APIs. The client may choose to reuse a session ID
   just in case the Websocket connection breaks. To reuse a session id, the
   client must reactivate the ID before it expires.
 - The login process will be like: provide credentials (user cert and user
   private key) and optionally an existing session id, the server checks if
   that session exists and were assigned to the given user cert, then renews
   the session if verification passes.
 - The server checks for inactive sessions and delete them if they expire.

3. Pub/sub and RPC happen under same topic, which is created as a Socket.io
chat room. Different members within this room may publish 3 kinds of
messages. The user cert describes which of these types are authorized for a
given user.

 - `event`, which is a one-shot message published by one party. No parties
   should expect to receive missed events. The server will broadcast the
   event in a room. Any user joining a room will receive the event, even the
   user having no publishing rights.
 - `request`, which is a RPC request. The server will randomly choose a party
   that declares the capability to make a response, and deliver that request
   to the processing party. If no party is available for response, the server
   returns an error to given user.
 - `response`, which is emitted by a processing party to the server. The server
   will determine who has sent the request corresponding to this response, and
   deliver the reply to that party directly.
 - Request & Response relationships are therefore maintained by the server, and
   the server may decide when the request is timed out (and forget any further
   responses). The client may implement its own timing out mechanism in case
   the server failed to send one. The processing party may be provided with an
   API, to inform the server and requesting party for extending the time out,
   and/or to update the processing status.
