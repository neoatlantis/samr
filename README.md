Socket.IO Application Message Router
====================================

This project builds a messaging system for integrating distributed nodes over a
central messaging router.

Features:

1. Data packet encryption with server PGP key, similar to TLS, and useful for
   cases when deploying the latter is unfeasible due to special reasons.
2. Client may join a few topics (implemented in Socket.IO's rooms) and do
 - pub/sub eventing
 - routed RPC call (from one member of the room, to another member)
3. Client authentication, with access control over joining which topic, and
   allowed action under specific topic.
