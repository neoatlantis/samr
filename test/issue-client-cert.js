const createOpenPGPCertIssuer = require("../libs/openpgp-auth/OpenPGPCertIssuer");
const createOpenPGPCertReader = require("../libs/openpgp-auth/OpenPGPCertReader");
const openpgp = require("openpgp");

const key = `
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
`;

async function run(){

    let issuer = await createOpenPGPCertIssuer(key);
    let publicKey = (await openpgp.readKey({ armoredKey: key })).toPublic().armor();

    let result = await issuer
        .bearer_fingerprint("bearer-fingerprint")
        .validity_duration(365*86400)
        .tag("auth.topic.r.generic-topic1")
        .tag("auth.topic.r.generic-topic2")
    .go();

    console.log("######### created cert as below");
    console.log(result);
    console.log("\n######### done ");

    let reader = await createOpenPGPCertReader(publicKey);
    let read_result = await reader.read(result);

    console.log(read_result);
    console.log(read_result.get_tags_with_wildcard("auth.topic.*"));

}
run();
