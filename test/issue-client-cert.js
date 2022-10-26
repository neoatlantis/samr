const createOpenPGPCertIssuer = require("../libs/openpgp-auth/OpenPGPCertIssuer");
const createOpenPGPCertReader = require("../libs/openpgp-auth/OpenPGPCertReader");
const make_proof = require("../libs/openpgp-auth/make_proof");
const verify_proof = require("../libs/openpgp-auth/verify_proof");

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
    let publicKey = (await openpgp.readKey({ armoredKey: key })).toPublic();
    let publicKeyArmored = publicKey.armor();

    let cert = await issuer
        .bearer_fingerprint(publicKey.getFingerprint())
        .validity_duration(365*86400)
        .tag("auth.topic.r.generic-topic1")
        .tag("auth.topic.r.generic-topic2")
    .go();

    console.log("######### created cert as below");
    console.log(cert);
    console.log("\n######### done ");


    let made_proof = await make_proof({
        claim: "test claim",
        cert: cert,
        private_key_armored: key,
    });

    let verified_proof = await verify_proof(made_proof, publicKeyArmored);

    console.log(verified_proof.json());




}
run();
