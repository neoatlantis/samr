<template>
<div>

Generate a pair of OpenPGP keys. You may use this key for general purpose.
For SAMR system, the server should have at least one authority PGP public key,
which is also used to issue certificates for incoming users.

<p />


<table>
    <tr>
        <td>Username</td>
        <td><input type="text" /></td>
    </tr>
    <tr>
        <td>Email</td>
        <td><input type="text" /></td>
    </tr>
    <tr>
        <td>Password</td>
        <td><input type="password" /></td>
        <td>Choose a strong password, important!</td>
    </tr>
    <tr>
        <td>Type password again</td>
        <td><input type="password" /></td>
    </tr>
</table>

</div>
</template>
<script>
</script>
