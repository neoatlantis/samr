const { initialize: server_init } = require("../server");

// require("openpgp").generateKey({ type: "ecc", curve: "curve25519", userIDs: [{ name: "test" }], format: "armored" }).then(({ privateKey })=>console.log(privateKey))

const server = server_init({ private_key: `
-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEY1QomRYJKwYBBAHaRw8BAQdA919J2UY6oxlAzZEfcrer48Id0spRKgmi
UwXwvBX/hvUAAP9FXomMahEXdkhGzflIPZLtjk7JafF5omwIpEbfeCJzAQ98
zQR0ZXN0wowEEBYKAD4FAmNUKJkECwkHCAkQ/mfz5slngQIDFQgKBBYAAgEC
GQECGwMCHgEWIQTmeiVUlWCa6NCqAyf+Z/PmyWeBAgAA2WIA/3VY83FzdZi6
FoUDyEWsN2IsyfRiTW4Baf34UsPHRPRkAQCkWlYCnUm6xllJ4ogtLqx/goE/
WNhh5pylAals7/1iDMddBGNUKJkSCisGAQQBl1UBBQEBB0AUuQ5+8J+N7o9r
8VuoAaEJVMfuLkA/V5uWVTud++23XQMBCAcAAP9/H4uzotifOY/WZ0NxxJhV
s1gVWyPvd31WXgCOqBXTCA+5wngEGBYIACoFAmNUKJkJEP5n8+bJZ4ECAhsM
FiEE5nolVJVgmujQqgMn/mfz5slngQIAAMAnAP0fbHy2cWqrpcnJ+KKoVDFn
RDt5CqRBGQftqnRp6CTQDQEAtepv2iRitmUgkvn6+pgzxqtRoEmS+b8Fp1u8
sgqqggA=
=ePch
-----END PGP PRIVATE KEY BLOCK-----
`});


server.on("secure-connection", (socket)=>{
    console.log("Server new connection secured, session id=", socket.get_session_id());
})
