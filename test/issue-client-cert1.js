const fs = require("fs");

const createOpenPGPCertIssuer = require("../libs/openpgp-auth/OpenPGPCertIssuer");
const createOpenPGPCertReader = require("../libs/openpgp-auth/OpenPGPCertReader");
const make_proof = require("../libs/openpgp-auth/make_proof");
const verify_proof = require("../libs/openpgp-auth/verify_proof");

const openpgp = require("openpgp");

const authority_key = fs
    .readFileSync("./keymaterials/pgp-authority-key.asc").toString();

async function run(){

    let authority = await createOpenPGPCertIssuer(authority_key);
    let authority_public_key =
        (await openpgp.readKey({ armoredKey: authority_key })).toPublic();
    let authority_public_key_armored = authority_public_key.armor();

    let bearer_private_key_armored = (fs
        .readFileSync("./keymaterials/pgp-userkey1.asc")
        .toString()
    );

    let bearer_public_key =
        (await openpgp.readKey({
            armoredKey: bearer_private_key_armored
        }))
        .toPublic();
    let bearer_public_key_armored = bearer_public_key.armor();

    let cert1 = await authority
        .bearer_fingerprint(bearer_public_key.getFingerprint())
        .validity_duration(365*86400)
        .tag("topic.events-only", ["publish"])
        .tag("topic.rpc-1", ["yield"])
        .tag("topic.rpc-2", ["call"])
    .go();

    console.log("######### created cert 1 as below");
    console.log(cert1);
    console.log("\n######### done ");


    /*
    let made_proof = await make_proof({
        claim: "test claim",
        cert: cert,
        private_key_armored: bearer_private_key_armored,
    });

    let verified_proof = await verify_proof(
        made_proof,
        authority_public_key_armored
     );

    console.log(verified_proof.json());*/




}
run();
